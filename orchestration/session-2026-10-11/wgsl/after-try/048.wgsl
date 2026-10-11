// Three.js r186 - Node System

// global
diagnostic( off, derivative_uniformity );


// structs

struct OutputStruct {
	@location( 0 ) color: vec4<f32>
};
var<private> output : OutputStruct;

// uniforms
@binding( 0 ) @group( 1 ) var nodeUniform2_sampler : sampler;
@binding( 1 ) @group( 1 ) var nodeUniform2 : texture_3d<f32>;
@binding( 3 ) @group( 1 ) var nodeUniform11_sampler : sampler;
@binding( 4 ) @group( 1 ) var nodeUniform11 : texture_2d<f32>;
@binding( 5 ) @group( 1 ) var nodeUniform24_sampler : sampler_comparison;
@binding( 6 ) @group( 1 ) var nodeUniform24 : texture_depth_2d;

struct renderStruct {
	cameraProjectionMatrix : mat4x4<f32>,
	cameraViewMatrix : mat4x4<f32>,
	nodeUniform13 : vec3<f32>,
	nodeUniform14 : vec3<f32>,
	nodeUniform12 : vec3<f32>,
	nodeUniform17 : vec3<f32>,
	nodeUniform20 : vec3<f32>,
	nodeUniform29 : vec3<f32>,
	nodeUniform30 : f32,
	nodeUniform31 : f32,
	nodeUniform15 : vec3<f32>,
	nodeUniform16 : vec3<f32>,
	nodeUniform18 : vec3<f32>,
	nodeUniform19 : vec3<f32>,
	nodeUniform28 : vec3<f32>,
	nodeUniform21 : mat4x4<f32>,
	nodeUniform22 : f32,
	nodeUniform23 : f32,
	nodeUniform27 : f32,
	cameraPosition : vec3<f32>,
	nodeUniform25 : f32,
	nodeUniform26 : vec2<f32>
};
@binding( 0 ) @group( 0 )
var<uniform> render : renderStruct;

struct objectStruct {
	nodeUniform1 : mat4x4<f32>,
	nodeUniform4 : mat3x3<f32>,
	nodeUniform6 : f32,
	nodeUniform7 : f32,
	nodeUniform8 : f32,
	nodeUniform9 : vec3<f32>,
	nodeUniform10 : f32,
	nodeUniform32 : vec3<f32>,
	nodeUniform33 : vec3<f32>,
	nodeUniform35 : vec3<f32>,
	nodeUniform36 : f32
};
@binding( 2 ) @group( 1 )
var<uniform> object : objectStruct;

// vars
var<private> DiffuseColor : vec4<f32>;
var<private> nodeVar0 : f32;
var<private> nodeVar1 : f32;
var<private> nodeVar2 : f32;
var<private> nodeVar3 : u32;
var<private> nodeVar4 : u32;
var<private> nodeVar5 : u32;
var<private> nodeVar6 : u32;
var<private> nodeVar7 : f32;
var<private> nodeVar8 : f32;
var<private> nodeVar9 : f32;
var<private> nodeVar10 : f32;
var<private> nodeVar11 : u32;
var<private> nodeVar12 : u32;
var<private> nodeVar13 : f32;
var<private> nodeVar14 : f32;
var<private> nodeVar15 : f32;
var<private> nodeVar16 : f32;
var<private> nodeVar17 : u32;
var<private> nodeVar18 : u32;
var<private> nodeVar19 : f32;
var<private> nodeVar20 : f32;
var<private> nodeVar21 : f32;
var<private> nodeVar22 : f32;
var<private> nodeVar23 : u32;
var<private> nodeVar24 : u32;
var<private> nodeVar25 : f32;
var<private> nodeVar26 : f32;
var<private> nodeVar27 : vec3<f32>;
var<private> nodeVar28 : f32;
var<private> normalViewGeometry : vec3<f32>;
var<private> NORMAL_normalView : vec3<f32>;
var<private> normalView : vec3<f32>;
var<private> normalWorld : vec3<f32>;
var<private> Metalness : f32;
var<private> Roughness : f32;
var<private> nodeVar29 : vec3<f32>;
var<private> SpecularColor : vec3<f32>;
var<private> SpecularColorBlended : vec3<f32>;
var<private> SpecularF90 : f32;
var<private> DiffuseContribution : vec3<f32>;
var<private> EmissiveColor : vec3<f32>;
var<private> Output : vec4<f32>;
var<private> positionViewDirection : vec3<f32>;
var<private> nodeVar30 : f32;
var<private> nodeVar31 : vec2<f32>;
var<private> nodeVar32 : f32;
var<private> nodeVar33 : f32;
var<private> nodeVar34 : f32;
var<private> nodeVar35 : f32;
var<private> nodeVar36 : vec3<f32>;
var<private> nodeVar37 : vec3<f32>;
var<private> irradiance : vec3<f32>;
var<private> nodeVar38 : f32;
var<private> nodeVar39 : f32;
var<private> nodeVar40 : f32;
var<private> nodeVar41 : vec3<f32>;
var<private> nodeVar42 : vec3<f32>;
var<private> nodeVar43 : vec3<f32>;
var<private> nodeVar44 : vec4<f32>;
var<private> nodeVar45 : vec4<f32>;
var<private> nodeVar46 : vec3<f32>;
var<private> nodeVar47 : vec3<f32>;
var<private> nodeVar48 : f32;
var<private> nodeVar49 : vec3<f32>;
var<private> nodeVar50 : vec3<f32>;
var<private> directDiffuse : vec3<f32>;
var<private> nodeVar51 : vec3<f32>;
var<private> nodeVar52 : vec3<f32>;
var<private> nodeVar53 : vec3<f32>;
var<private> nodeVar54 : vec3<f32>;
var<private> nodeVar55 : f32;
var<private> nodeVar56 : f32;
var<private> nodeVar57 : f32;
var<private> nodeVar58 : vec3<f32>;
var<private> nodeVar59 : vec3<f32>;
var<private> nodeVar60 : vec3<f32>;
var<private> nodeVar61 : vec3<f32>;
var<private> nodeVar62 : vec3<f32>;
var<private> directSpecular : vec3<f32>;
var<private> nodeVar63 : vec3<f32>;
var<private> nodeVar64 : f32;
var<private> nodeVar65 : f32;
var<private> nodeVar66 : f32;
var<private> nodeVar67 : vec3<f32>;
var<private> nodeVar68 : vec3<f32>;
var<private> nodeVar69 : vec3<f32>;
var<private> nodeVar70 : vec3<f32>;
var<private> nodeVar71 : vec3<f32>;
var<private> nodeVar72 : vec4<f32>;
var<private> nodeVar73 : vec4<f32>;
var<private> nodeVar74 : vec3<f32>;
var<private> nodeVar75 : vec3<f32>;
var<private> nodeVar76 : f32;
var<private> shadowPositionWorld : vec3<f32>;
var<private> nodeVar77 : f32;
var<private> nodeVar78 : vec4<f32>;
var<private> nodeVar79 : vec3<f32>;
var<private> nodeVar80 : vec3<f32>;
var<private> nodeVar81 : f32;
var<private> nodeVar82 : f32;
var<private> nodeVar83 : vec2<f32>;
var<private> nodeVar84 : f32;
var<private> nodeVar85 : vec2<f32>;
var<private> nodeVar86 : f32;
var<private> nodeVar87 : vec2<f32>;
var<private> nodeVar88 : f32;
var<private> nodeVar89 : vec2<f32>;
var<private> nodeVar90 : f32;
var<private> nodeVar91 : vec2<f32>;
var<private> nodeVar92 : f32;
var<private> nodeVar93 : f32;
var<private> nodeVar94 : vec3<f32>;
var<private> nodeVar95 : vec3<f32>;
var<private> nodeVar96 : vec3<f32>;
var<private> nodeVar97 : vec3<f32>;
var<private> nodeVar98 : vec3<f32>;
var<private> nodeVar99 : vec3<f32>;
var<private> nodeVar100 : f32;
var<private> nodeVar101 : f32;
var<private> nodeVar102 : f32;
var<private> nodeVar103 : vec3<f32>;
var<private> nodeVar104 : vec3<f32>;
var<private> nodeVar105 : vec3<f32>;
var<private> nodeVar106 : vec3<f32>;
var<private> nodeVar107 : vec3<f32>;
var<private> nodeVar108 : vec3<f32>;
var<private> nodeVar109 : f32;
var<private> nodeVar110 : f32;
var<private> nodeVar111 : f32;
var<private> nodeVar112 : vec3<f32>;
var<private> nodeVar113 : vec3<f32>;
var<private> nodeVar114 : vec3<f32>;
var<private> nodeVar115 : vec3<f32>;
var<private> nodeVar116 : vec3<f32>;
var<private> nodeVar117 : vec3<f32>;
var<private> nodeVar118 : f32;
var<private> nodeVar119 : f32;
var<private> nodeVar120 : f32;
var<private> nodeVar121 : f32;
var<private> nodeVar122 : f32;
var<private> nodeVar123 : vec3<f32>;
var<private> nodeVar124 : vec3<f32>;
var<private> nodeVar125 : vec3<f32>;
var<private> nodeVar126 : vec3<f32>;
var<private> nodeVar127 : vec3<f32>;
var<private> nodeVar128 : vec3<f32>;
var<private> nodeVar129 : vec3<f32>;
var<private> nodeVar130 : f32;
var<private> nodeVar131 : f32;
var<private> nodeVar132 : f32;
var<private> nodeVar133 : vec3<f32>;
var<private> nodeVar134 : vec3<f32>;
var<private> nodeVar135 : vec3<f32>;
var<private> nodeVar136 : vec3<f32>;
var<private> nodeVar137 : vec3<f32>;
var<private> nodeVar138 : vec3<f32>;
var<private> nodeVar139 : f32;
var<private> nodeVar140 : f32;
var<private> nodeVar141 : f32;
var<private> nodeVar142 : vec3<f32>;
var<private> nodeVar143 : vec3<f32>;
var<private> nodeVar144 : vec3<f32>;
var<private> nodeVar145 : vec3<f32>;
var<private> nodeVar146 : vec3<f32>;
var<private> nodeVar147 : vec3<f32>;
var<private> nodeVar148 : vec3<f32>;
var<private> nodeVar149 : f32;
var<private> nodeVar150 : vec3<f32>;
var<private> nodeVar151 : vec3<f32>;
var<private> nodeVar152 : vec3<f32>;
var<private> nodeVar153 : vec3<f32>;
var<private> nodeVar154 : vec3<f32>;
var<private> nodeVar155 : vec3<f32>;
var<private> nodeVar156 : vec3<f32>;
var<private> nodeVar157 : f32;
var<private> nodeVar158 : f32;
var<private> nodeVar159 : f32;
var<private> nodeVar160 : vec3<f32>;
var<private> nodeVar161 : vec3<f32>;
var<private> nodeVar162 : vec3<f32>;
var<private> nodeVar163 : vec3<f32>;
var<private> nodeVar164 : vec3<f32>;
var<private> nodeVar165 : vec3<f32>;
var<private> nodeVar166 : vec3<f32>;
var<private> nodeVar167 : vec3<f32>;
var<private> nodeVar168 : vec3<f32>;
var<private> nodeVar169 : vec3<f32>;
var<private> nodeVar170 : vec3<f32>;
var<private> nodeVar171 : vec3<f32>;
var<private> nodeVar172 : vec3<f32>;
var<private> indirectDiffuse : vec3<f32>;
var<private> nodeVar173 : vec3<f32>;
var<private> singleScatteringDielectric : vec3<f32>;
var<private> multiScatteringDielectric : vec3<f32>;
var<private> singleScatteringMetallic : vec3<f32>;
var<private> multiScatteringMetallic : vec3<f32>;
var<private> nodeVar174 : vec3<f32>;
var<private> nodeVar175 : f32;
var<private> nodeVar176 : vec3<f32>;
var<private> nodeVar177 : vec3<f32>;
var<private> nodeVar178 : vec3<f32>;
var<private> nodeVar179 : vec3<f32>;
var<private> nodeVar180 : vec3<f32>;
var<private> nodeVar181 : vec3<f32>;
var<private> nodeVar182 : vec3<f32>;
var<private> nodeVar183 : f32;
var<private> nodeVar184 : f32;
var<private> nodeVar185 : f32;
var<private> nodeVar186 : vec3<f32>;
var<private> nodeVar187 : vec3<f32>;
var<private> nodeVar188 : vec3<f32>;
var<private> nodeVar189 : vec3<f32>;
var<private> nodeVar190 : vec3<f32>;
var<private> nodeVar191 : vec3<f32>;
var<private> nodeVar192 : vec3<f32>;
var<private> nodeVar193 : f32;
var<private> nodeVar194 : vec3<f32>;
var<private> nodeVar195 : vec3<f32>;
var<private> nodeVar196 : vec3<f32>;
var<private> nodeVar197 : vec3<f32>;
var<private> nodeVar198 : vec3<f32>;
var<private> nodeVar199 : vec3<f32>;
var<private> nodeVar200 : vec3<f32>;
var<private> nodeVar201 : f32;
var<private> nodeVar202 : f32;
var<private> nodeVar203 : f32;
var<private> nodeVar204 : vec3<f32>;
var<private> nodeVar205 : vec3<f32>;
var<private> nodeVar206 : vec3<f32>;
var<private> nodeVar207 : vec3<f32>;
var<private> nodeVar208 : vec3<f32>;
var<private> nodeVar209 : vec3<f32>;
var<private> radiance : vec3<f32>;
var<private> nodeVar210 : vec3<f32>;
var<private> nodeVar211 : vec3<f32>;
var<private> nodeVar212 : vec3<f32>;
var<private> iblIrradiance : vec3<f32>;
var<private> nodeVar213 : vec3<f32>;
var<private> nodeVar214 : vec3<f32>;
var<private> nodeVar215 : vec3<f32>;
var<private> nodeVar216 : vec3<f32>;
var<private> nodeVar217 : vec3<f32>;
var<private> nodeVar218 : vec3<f32>;
var<private> nodeVar219 : vec3<f32>;
var<private> nodeVar220 : vec3<f32>;
var<private> nodeVar221 : vec3<f32>;
var<private> nodeVar222 : vec3<f32>;
var<private> indirectSpecular : vec3<f32>;
var<private> nodeVar223 : vec3<f32>;
var<private> nodeVar224 : vec3<f32>;
var<private> ambientOcclusion : f32;
var<private> nodeVar225 : vec3<f32>;
var<private> nodeVar226 : f32;
var<private> nodeVar227 : f32;
var<private> nodeVar228 : f32;
var<private> nodeVar229 : f32;
var<private> nodeVar230 : f32;
var<private> nodeVar231 : f32;
var<private> nodeVar232 : f32;
var<private> nodeVar233 : f32;
var<private> nodeVar234 : f32;
var<private> nodeVar235 : f32;
var<private> nodeVar236 : f32;
var<private> nodeVar237 : vec3<f32>;
var<private> totalDiffuse : vec3<f32>;
var<private> nodeVar238 : vec3<f32>;
var<private> totalSpecular : vec3<f32>;
var<private> nodeVar239 : vec3<f32>;
var<private> outgoingLight : vec3<f32>;
var<private> nodeVar240 : vec3<f32>;
var<private> nodeVar241 : f32;
var<private> nodeVar242 : vec4<f32>;

// codes
fn V_GGX_SmithCorrelated ( alpha : f32, dotNL : f32, dotNV : f32 ) -> f32 {

	var nodeVar0 : f32;

	nodeVar0 = ( alpha * alpha );

	return ( 0.5 / max( ( ( dotNL * sqrt( ( nodeVar0 + ( ( 1.0 - nodeVar0 ) * ( dotNV * dotNV ) ) ) ) ) + ( dotNV * sqrt( ( nodeVar0 + ( ( 1.0 - nodeVar0 ) * ( dotNL * dotNL ) ) ) ) ) ), 0.000001 ) );

}


fn D_GGX ( alpha : f32, dotNH : f32 ) -> f32 {

	var nodeVar0 : f32;
	var nodeVar1 : f32;

	nodeVar0 = ( alpha * alpha );
	nodeVar1 = ( 1.0 - ( ( dotNH * dotNH ) * ( 1.0 - nodeVar0 ) ) );

	return ( ( nodeVar0 / ( nodeVar1 * nodeVar1 ) ) * 0.3183098861837907 );

}


fn interleavedGradientNoise ( position : vec2<f32> ) -> f32 {

	


	return fract( ( 52.9829189 * fract( dot( position, vec2<f32>( 0.06711056, 0.00583715 ) ) ) ) );

}


fn vogelDiskSample ( sampleIndex : i32, samplesCount : i32, phi : f32 ) -> vec2<f32> {

	var nodeVar0 : f32;

	nodeVar0 = ( ( f32( sampleIndex ) * 2.399963229728653 ) + phi );

	return ( vec2<f32>( cos( nodeVar0 ), sin( nodeVar0 ) ) * vec2<f32>( sqrt( ( ( f32( sampleIndex ) + 0.5 ) / f32( samplesCount ) ) ) ) );

}




@fragment
fn main( @location( 0 ) v_positionView : vec3<f32>,
	@location( 1 ) v_positionWorld : vec3<f32>,
	@location( 2 ) v_normalViewGeometry : vec3<f32>,
	@location( 3 ) v_positionViewDirection : vec3<f32>,
	@builtin( position ) fragCoord : vec4<f32> ) -> OutputStruct {

	// flow
	// code

	nodeVar0 = textureSample( nodeUniform2, nodeUniform2_sampler, ( ( v_positionWorld * vec3<f32>( 0.3 ) ) / vec3<f32>( 8.0 ) ) ).x;
	nodeVar1 = ( ( ( ( v_positionWorld.y * 0.85 ) + ( nodeVar0 * 0.7 ) ) + ( v_positionWorld.x * 0.05 ) ) - ( v_positionWorld.z * 0.04 ) );
	nodeVar2 = floor( nodeVar1 );
	nodeVar3 = ( ( u32( ( nodeVar2 + 90.0 ) ) * 747796405u ) + 2891336453u );
	nodeVar4 = ( ( ( nodeVar3 >> ( ( nodeVar3 >> 28u ) + 4u ) ) ^ nodeVar3 ) * 277803737u );
	nodeVar5 = ( ( u32( ( nodeVar2 + 91.0 ) ) * 747796405u ) + 2891336453u );
	nodeVar6 = ( ( ( nodeVar5 >> ( ( nodeVar5 >> 28u ) + 4u ) ) ^ nodeVar5 ) * 277803737u );
	nodeVar7 = ( f32( ( ( nodeVar6 >> 22u ) ^ nodeVar6 ) ) * 2.3283064365386963e-10 );
	nodeVar8 = fwidth( nodeVar1 );
	nodeVar9 = min( max( ( nodeVar8 * 1.5 ), 0.16 ), 0.5 );
	nodeVar10 = fract( nodeVar1 );
	nodeVar11 = ( ( u32( ( nodeVar2 + 17.0 ) ) * 747796405u ) + 2891336453u );
	nodeVar12 = ( ( ( nodeVar11 >> ( ( nodeVar11 >> 28u ) + 4u ) ) ^ nodeVar11 ) * 277803737u );
	nodeVar13 = ( f32( ( ( nodeVar12 >> 22u ) ^ nodeVar12 ) ) * 2.3283064365386963e-10 );
	nodeVar14 = ( ( ( ( ( v_positionWorld.x * 0.8 ) + ( v_positionWorld.z * 0.6 ) ) + ( nodeVar0 * 1.4 ) ) + ( nodeVar13 * 9.0 ) ) + ( ( nodeVar10 * ( nodeVar7 - 0.5 ) ) * 2.4 ) );
	nodeVar15 = ( ( nodeVar7 * 2.6 ) + 2.2 );
	nodeVar16 = ( nodeVar14 / nodeVar15 );
	nodeVar17 = ( ( u32( ( ( floor( nodeVar16 ) + ( nodeVar2 * 31.0 ) ) + 1000.0 ) ) * 747796405u ) + 2891336453u );
	nodeVar18 = ( ( ( nodeVar17 >> ( ( nodeVar17 >> 28u ) + 4u ) ) ^ nodeVar17 ) * 277803737u );
	nodeVar19 = max( 0.12, ( fwidth( nodeVar14 ) * 1.5 ) );
	nodeVar20 = fract( nodeVar16 );
	nodeVar21 = ( min( nodeVar20, ( 1.0 - nodeVar20 ) ) * nodeVar15 );
	nodeVar22 = ( smoothstep( 0.0, nodeVar9, nodeVar10 ) * smoothstep( 1.0, ( 1.0 - nodeVar9 ), nodeVar10 ) );
	nodeVar23 = ( ( u32( ( nodeVar2 + 16.0 ) ) * 747796405u ) + 2891336453u );
	nodeVar24 = ( ( ( nodeVar23 >> ( ( nodeVar23 >> 28u ) + 4u ) ) ^ nodeVar23 ) * 277803737u );
	nodeVar25 = textureSample( nodeUniform2, nodeUniform2_sampler, ( ( v_positionWorld * vec3<f32>( 5.3 ) ) / vec3<f32>( 8.0 ) ) ).x;
	nodeVar26 = max( 0.1, ( nodeVar8 * 1.5 ) );
	nodeVar27 = ( ( mix( vec3<f32>( 0.88, 0.94, 1.04 ), vec3<f32>( 1.04, 1.0, 0.92 ), mix( ( f32( ( ( nodeVar4 >> 22u ) ^ nodeVar4 ) ) * 2.3283064365386963e-10 ), nodeVar7, smoothstep( 0.0, nodeVar9, nodeVar10 ) ) ) * vec3<f32>( max( ( ( ( ( ( ( 0.7 + ( mix( 0.5, ( f32( ( ( nodeVar18 >> 22u ) ^ nodeVar18 ) ) * 2.3283064365386963e-10 ), ( smoothstep( 0.0, nodeVar19, nodeVar21 ) * nodeVar22 ) ) * 0.45 ) ) + ( mix( ( f32( ( ( nodeVar24 >> 22u ) ^ nodeVar24 ) ) * 2.3283064365386963e-10 ), nodeVar13, smoothstep( 0.0, nodeVar9, nodeVar10 ) ) * 0.2 ) ) + ( nodeVar0 * 0.18 ) ) + ( nodeVar25 * 0.1 ) ) - ( ( 1.0 - smoothstep( 0.5, 1.0, 0.6 ) ) * 0.08 ) ) - ( smoothstep( 0.1, 0.7, -1.0 ) * 0.2 ) ), 0.12 ) ) ) * vec3<f32>( ( ( ( 1.0 - ( ( 1.0 - ( smoothstep( 0.0, nodeVar26, nodeVar10 ) * smoothstep( 1.0, ( 1.0 - nodeVar26 ), nodeVar10 ) ) ) * 0.35 ) ) * ( 1.0 - ( ( ( ( 1.0 - smoothstep( 0.02, nodeVar19, nodeVar21 ) ) * smoothstep( 0.3, 0.55, nodeVar13 ) ) * nodeVar22 ) * 0.4 ) ) ) * ( 1.0 - ( 0.0 * 0.45 ) ) ) ) );
	nodeVar28 = smoothstep( 0.2, 0.55, ( nodeVar0 + ( nodeVar25 * 0.5 ) ) );
	normalViewGeometry = normalize( v_normalViewGeometry );
	NORMAL_normalView = normalViewGeometry;
	normalView = NORMAL_normalView;
	normalWorld = normalize( ( vec4<f32>( normalView, 0.0 ) * render.cameraViewMatrix ).xyz );
	DiffuseColor = vec4<f32>( mix( ( vec3<f32>( 0.19, 0.18, 0.17 ) * mix( mix( nodeVar27, ( ( nodeVar27 * vec3<f32>( 0.82, 0.9, 1.0 ) ) * vec3<f32>( 0.82 ) ), ( 0.6 * 0.7 ) ), ( vec3<f32>( 0.82, 0.88, 0.72 ) * vec3<f32>( 0.8 ) ), min( ( ( ( ( ( ( smoothstep( 0.45, 0.75, nodeVar10 ) * smoothstep( 1.0, 0.9, nodeVar10 ) ) * nodeVar28 ) * ( 0.35 + smoothstep( 0.0, 0.5, normalWorld.y ) ) ) * nodeVar22 ) * 0.4 ) + ( ( 0.6 * nodeVar28 ) * 0.12 ) ), 0.45 ) ) ), vec3<f32>( 0.24, 0.215, 0.18 ), ( smoothstep( 0.55, 0.95, normalWorld.y ) * 0.35 ) ), 1.0 );
	DiffuseColor.w = ( DiffuseColor.w * object.nodeUniform6 );
	DiffuseColor.w = 1.0;
	Metalness = object.nodeUniform7;
	nodeVar29 = max( abs( dpdx( normalViewGeometry ) ), abs( - dpdy( normalViewGeometry ) ) );
	Roughness = min( ( max( object.nodeUniform8, 0.0525 ) + max( max( nodeVar29.x, nodeVar29.y ), nodeVar29.z ) ), 1.0 );
	SpecularColor = vec3<f32>( 0.04, 0.04, 0.04 );
	SpecularColorBlended = mix( vec3<f32>( 0.04, 0.04, 0.04 ), DiffuseColor.xyz, Metalness );
	SpecularF90 = 1.0;
	DiffuseContribution = ( DiffuseColor.xyz * vec3<f32>( ( 1.0 - object.nodeUniform7 ) ) );
	EmissiveColor = ( object.nodeUniform9 * vec3<f32>( object.nodeUniform10 ) );
	positionViewDirection = normalize( v_positionViewDirection );
	nodeVar30 = dot( normalView, positionViewDirection );
	nodeVar31 = textureSample( nodeUniform11, nodeUniform11_sampler, vec2<f32>( Roughness, clamp( nodeVar30, 0.0, 1.0 ) ) ).xy;
	let dfg = nodeVar31;
	nodeVar32 = ( dfg.x + dfg.y );
	nodeVar33 = ( 1.0 / nodeVar32 );
	nodeVar34 = nodeVar33;
	nodeVar35 = ( nodeVar34 - 1.0 );
	nodeVar36 = ( SpecularColorBlended * vec3<f32>( nodeVar35 ) );
	nodeVar37 = ( nodeVar36 + vec3<f32>( 1.0 ) );
	let multiScatteringCompensation = nodeVar37;
	irradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar38 = dot( normalWorld, normalize( render.nodeUniform14 ) );
	nodeVar39 = ( nodeVar38 * 0.5 );
	nodeVar40 = ( nodeVar39 + 0.5 );
	nodeVar41 = mix( render.nodeUniform12, render.nodeUniform13, nodeVar40 );
	nodeVar42 = ( irradiance + nodeVar41 );
	irradiance = nodeVar42;
	nodeVar43 = ( render.nodeUniform15 - render.nodeUniform16 );
	nodeVar44 = vec4<f32>( nodeVar43, 0.0 );
	nodeVar45 = ( render.cameraViewMatrix * nodeVar44 );
	nodeVar46 = normalize( nodeVar45.xyz );
	nodeVar47 = nodeVar46;
	nodeVar48 = dot( normalView, nodeVar47 );
	nodeVar49 = ( vec3<f32>( clamp( nodeVar48, 0.0, 1.0 ) ) * render.nodeUniform17 );
	nodeVar50 = nodeVar49;
	directDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar51 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar52 = ( nodeVar50 * nodeVar51 );
	nodeVar53 = ( nodeVar47 + positionViewDirection );
	nodeVar54 = normalize( nodeVar53 );
	nodeVar55 = dot( positionViewDirection, nodeVar54 );
	nodeVar56 = clamp( nodeVar55, 0.0, 1.0 );
	nodeVar57 = exp2( ( ( ( nodeVar56 * -5.55473 ) - 6.98316 ) * nodeVar56 ) );
	nodeVar58 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar57 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar57 ) ) );
	nodeVar59 = ( vec3<f32>( 1.0 ) - nodeVar58 );
	nodeVar60 = nodeVar59;
	nodeVar61 = ( nodeVar52 * nodeVar60 );
	nodeVar62 = ( directDiffuse + nodeVar61 );
	directDiffuse = nodeVar62;
	directSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar63 = normalize( ( nodeVar47 + positionViewDirection ) );
	nodeVar64 = clamp( dot( positionViewDirection, nodeVar63 ), 0.0, 1.0 );
	nodeVar65 = exp2( ( ( ( nodeVar64 * -5.55473 ) - 6.98316 ) * nodeVar64 ) );
	nodeVar66 = ( Roughness * Roughness );
	nodeVar67 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar65 ) ) ) + vec3<f32>( ( 1.0 * nodeVar65 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar66, clamp( dot( normalView, nodeVar47 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar66, clamp( dot( normalView, nodeVar63 ), 0.0, 1.0 ) ) ) );
	nodeVar68 = ( nodeVar50 * nodeVar67 );
	nodeVar69 = ( nodeVar68 * multiScatteringCompensation );
	nodeVar70 = ( directSpecular + nodeVar69 );
	directSpecular = nodeVar70;
	nodeVar71 = ( render.nodeUniform18 - render.nodeUniform19 );
	nodeVar72 = vec4<f32>( nodeVar71, 0.0 );
	nodeVar73 = ( render.cameraViewMatrix * nodeVar72 );
	nodeVar74 = normalize( nodeVar73.xyz );
	nodeVar75 = nodeVar74;
	nodeVar76 = dot( normalView, nodeVar75 );
	shadowPositionWorld = v_positionWorld;
	nodeVar78 = ( render.nodeUniform21 * vec4<f32>( ( shadowPositionWorld + ( normalWorld * vec3<f32>( render.nodeUniform22 ) ) ), 1.0 ) );
	nodeVar79 = ( nodeVar78.xyz / vec3<f32>( nodeVar78.w ) );
	nodeVar80 = vec3<f32>( nodeVar79.x, ( 1.0 - nodeVar79.y ), ( nodeVar79.z + render.nodeUniform23 ) );

	if ( ( ( ( ( ( nodeVar80.x >= 0.0 ) && ( nodeVar80.x <= 1.0 ) ) && ( nodeVar80.y >= 0.0 ) ) && ( nodeVar80.y <= 1.0 ) ) && ( nodeVar80.z <= 1.0 ) ) ) {

		nodeVar81 = ( interleavedGradientNoise( fragCoord.xy ) * 6.28318530718 );
		nodeVar82 = ( render.nodeUniform25 * ( vec2<f32>( 1.0, 1.0 ) / render.nodeUniform26 ).x );
		nodeVar83 = ( nodeVar80.xy + ( vogelDiskSample( 0, 5, nodeVar81 ) * vec2<f32>( nodeVar82 ) ) );
		nodeVar84 = textureSampleCompare( nodeUniform24, nodeUniform24_sampler, nodeVar83, nodeVar80.z );
		nodeVar85 = ( nodeVar80.xy + ( vogelDiskSample( 1, 5, nodeVar81 ) * vec2<f32>( nodeVar82 ) ) );
		nodeVar86 = textureSampleCompare( nodeUniform24, nodeUniform24_sampler, nodeVar85, nodeVar80.z );
		nodeVar87 = ( nodeVar80.xy + ( vogelDiskSample( 2, 5, nodeVar81 ) * vec2<f32>( nodeVar82 ) ) );
		nodeVar88 = textureSampleCompare( nodeUniform24, nodeUniform24_sampler, nodeVar87, nodeVar80.z );
		nodeVar89 = ( nodeVar80.xy + ( vogelDiskSample( 3, 5, nodeVar81 ) * vec2<f32>( nodeVar82 ) ) );
		nodeVar90 = textureSampleCompare( nodeUniform24, nodeUniform24_sampler, nodeVar89, nodeVar80.z );
		nodeVar91 = ( nodeVar80.xy + ( vogelDiskSample( 4, 5, nodeVar81 ) * vec2<f32>( nodeVar82 ) ) );
		nodeVar92 = textureSampleCompare( nodeUniform24, nodeUniform24_sampler, nodeVar91, nodeVar80.z );
		nodeVar77 = ( ( ( ( ( nodeVar84 + nodeVar86 ) + nodeVar88 ) + nodeVar90 ) + nodeVar92 ) * 0.2 );

	} else {

		nodeVar77 = 1.0;

	}

	nodeVar93 = mix( 1.0, nodeVar77, render.nodeUniform27 );
	nodeVar94 = ( vec3<f32>( clamp( nodeVar76, 0.0, 1.0 ) ) * ( render.nodeUniform20 * vec3<f32>( nodeVar93 ) ) );
	nodeVar95 = nodeVar94;
	nodeVar96 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar97 = ( nodeVar95 * nodeVar96 );
	nodeVar98 = ( nodeVar75 + positionViewDirection );
	nodeVar99 = normalize( nodeVar98 );
	nodeVar100 = dot( positionViewDirection, nodeVar99 );
	nodeVar101 = clamp( nodeVar100, 0.0, 1.0 );
	nodeVar102 = exp2( ( ( ( nodeVar101 * -5.55473 ) - 6.98316 ) * nodeVar101 ) );
	nodeVar103 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar102 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar102 ) ) );
	nodeVar104 = ( vec3<f32>( 1.0 ) - nodeVar103 );
	nodeVar105 = nodeVar104;
	nodeVar106 = ( nodeVar97 * nodeVar105 );
	nodeVar107 = ( directDiffuse + nodeVar106 );
	directDiffuse = nodeVar107;
	nodeVar108 = normalize( ( nodeVar75 + positionViewDirection ) );
	nodeVar109 = clamp( dot( positionViewDirection, nodeVar108 ), 0.0, 1.0 );
	nodeVar110 = exp2( ( ( ( nodeVar109 * -5.55473 ) - 6.98316 ) * nodeVar109 ) );
	nodeVar111 = ( Roughness * Roughness );
	nodeVar112 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar110 ) ) ) + vec3<f32>( ( 1.0 * nodeVar110 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar111, clamp( dot( normalView, nodeVar75 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar111, clamp( dot( normalView, nodeVar108 ), 0.0, 1.0 ) ) ) );
	nodeVar113 = ( nodeVar95 * nodeVar112 );
	nodeVar114 = ( nodeVar113 * multiScatteringCompensation );
	nodeVar115 = ( directSpecular + nodeVar114 );
	directSpecular = nodeVar115;
	nodeVar116 = ( render.nodeUniform28 - v_positionView );
	nodeVar117 = normalize( nodeVar116 );
	nodeVar118 = dot( normalView, nodeVar117 );

	if ( ( render.nodeUniform30 > 0.0 ) ) {

		nodeVar120 = length( nodeVar116 );
		nodeVar121 = ( nodeVar120 / render.nodeUniform30 );
		nodeVar122 = clamp( ( 1.0 - ( ( ( nodeVar121 * nodeVar121 ) * nodeVar121 ) * nodeVar121 ) ), 0.0, 1.0 );
		nodeVar119 = ( ( 1.0 / max( pow( nodeVar120, render.nodeUniform31 ), 0.01 ) ) * ( nodeVar122 * nodeVar122 ) );

	} else {

		nodeVar119 = ( 1.0 / max( pow( length( nodeVar116 ), render.nodeUniform31 ), 0.01 ) );

	}

	nodeVar123 = ( render.nodeUniform29 * vec3<f32>( nodeVar119 ) );
	nodeVar124 = ( vec3<f32>( clamp( nodeVar118, 0.0, 1.0 ) ) * nodeVar123 );
	nodeVar125 = nodeVar124;
	nodeVar126 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar127 = ( nodeVar125 * nodeVar126 );
	nodeVar128 = ( nodeVar117 + positionViewDirection );
	nodeVar129 = normalize( nodeVar128 );
	nodeVar130 = dot( positionViewDirection, nodeVar129 );
	nodeVar131 = clamp( nodeVar130, 0.0, 1.0 );
	nodeVar132 = exp2( ( ( ( nodeVar131 * -5.55473 ) - 6.98316 ) * nodeVar131 ) );
	nodeVar133 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar132 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar132 ) ) );
	nodeVar134 = ( vec3<f32>( 1.0 ) - nodeVar133 );
	nodeVar135 = nodeVar134;
	nodeVar136 = ( nodeVar127 * nodeVar135 );
	nodeVar137 = ( directDiffuse + nodeVar136 );
	directDiffuse = nodeVar137;
	nodeVar138 = normalize( ( nodeVar117 + positionViewDirection ) );
	nodeVar139 = clamp( dot( positionViewDirection, nodeVar138 ), 0.0, 1.0 );
	nodeVar140 = exp2( ( ( ( nodeVar139 * -5.55473 ) - 6.98316 ) * nodeVar139 ) );
	nodeVar141 = ( Roughness * Roughness );
	nodeVar142 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar140 ) ) ) + vec3<f32>( ( 1.0 * nodeVar140 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar141, clamp( dot( normalView, nodeVar117 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar141, clamp( dot( normalView, nodeVar138 ), 0.0, 1.0 ) ) ) );
	nodeVar143 = ( nodeVar125 * nodeVar142 );
	nodeVar144 = ( nodeVar143 * multiScatteringCompensation );
	nodeVar145 = ( directSpecular + nodeVar144 );
	directSpecular = nodeVar145;
	nodeVar146 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar147 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar148 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar149 = ( SpecularF90 * dfg.y );
	nodeVar150 = ( nodeVar148 + vec3<f32>( nodeVar149 ) );
	nodeVar151 = ( nodeVar146 + nodeVar150 );
	nodeVar146 = nodeVar151;
	nodeVar152 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar153 = nodeVar152;
	nodeVar154 = ( nodeVar153 * vec3<f32>( 0.047619 ) );
	nodeVar155 = ( SpecularColor + nodeVar154 );
	nodeVar156 = ( nodeVar150 * nodeVar155 );
	nodeVar157 = ( dfg.x + dfg.y );
	nodeVar158 = ( 1.0 - nodeVar157 );
	nodeVar159 = nodeVar158;
	nodeVar160 = ( vec3<f32>( nodeVar159 ) * nodeVar155 );
	nodeVar161 = ( vec3<f32>( 1.0 ) - nodeVar160 );
	nodeVar162 = nodeVar161;
	nodeVar163 = ( nodeVar156 / nodeVar162 );
	nodeVar164 = ( nodeVar163 * vec3<f32>( nodeVar159 ) );
	nodeVar165 = ( nodeVar147 + nodeVar164 );
	nodeVar147 = nodeVar165;
	nodeVar166 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar167 = ( irradiance * nodeVar166 );
	nodeVar168 = ( nodeVar146 + nodeVar147 );
	nodeVar169 = ( vec3<f32>( 1.0 ) - nodeVar168 );
	nodeVar170 = nodeVar169;
	nodeVar171 = ( nodeVar167 * nodeVar170 );
	nodeVar172 = nodeVar171;
	indirectDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar173 = ( indirectDiffuse + nodeVar172 );
	indirectDiffuse = nodeVar173;
	singleScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	singleScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar174 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar175 = ( SpecularF90 * dfg.y );
	nodeVar176 = ( nodeVar174 + vec3<f32>( nodeVar175 ) );
	nodeVar177 = ( singleScatteringDielectric + nodeVar176 );
	singleScatteringDielectric = nodeVar177;
	nodeVar178 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar179 = nodeVar178;
	nodeVar180 = ( nodeVar179 * vec3<f32>( 0.047619 ) );
	nodeVar181 = ( SpecularColor + nodeVar180 );
	nodeVar182 = ( nodeVar176 * nodeVar181 );
	nodeVar183 = ( dfg.x + dfg.y );
	nodeVar184 = ( 1.0 - nodeVar183 );
	nodeVar185 = nodeVar184;
	nodeVar186 = ( vec3<f32>( nodeVar185 ) * nodeVar181 );
	nodeVar187 = ( vec3<f32>( 1.0 ) - nodeVar186 );
	nodeVar188 = nodeVar187;
	nodeVar189 = ( nodeVar182 / nodeVar188 );
	nodeVar190 = ( nodeVar189 * vec3<f32>( nodeVar185 ) );
	nodeVar191 = ( multiScatteringDielectric + nodeVar190 );
	multiScatteringDielectric = nodeVar191;
	nodeVar192 = ( DiffuseColor.xyz * vec3<f32>( dfg.x ) );
	nodeVar193 = ( SpecularF90 * dfg.y );
	nodeVar194 = ( nodeVar192 + vec3<f32>( nodeVar193 ) );
	nodeVar195 = ( singleScatteringMetallic + nodeVar194 );
	singleScatteringMetallic = nodeVar195;
	nodeVar196 = ( vec3<f32>( 1.0 ) - DiffuseColor.xyz );
	nodeVar197 = nodeVar196;
	nodeVar198 = ( nodeVar197 * vec3<f32>( 0.047619 ) );
	nodeVar199 = ( DiffuseColor.xyz + nodeVar198 );
	nodeVar200 = ( nodeVar194 * nodeVar199 );
	nodeVar201 = ( dfg.x + dfg.y );
	nodeVar202 = ( 1.0 - nodeVar201 );
	nodeVar203 = nodeVar202;
	nodeVar204 = ( vec3<f32>( nodeVar203 ) * nodeVar199 );
	nodeVar205 = ( vec3<f32>( 1.0 ) - nodeVar204 );
	nodeVar206 = nodeVar205;
	nodeVar207 = ( nodeVar200 / nodeVar206 );
	nodeVar208 = ( nodeVar207 * vec3<f32>( nodeVar203 ) );
	nodeVar209 = ( multiScatteringMetallic + nodeVar208 );
	multiScatteringMetallic = nodeVar209;
	radiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar210 = mix( singleScatteringDielectric, singleScatteringMetallic, Metalness );
	nodeVar211 = ( radiance * nodeVar210 );
	nodeVar212 = mix( multiScatteringDielectric, multiScatteringMetallic, Metalness );
	iblIrradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar213 = ( iblIrradiance * vec3<f32>( 0.3183098861837907 ) );
	nodeVar214 = ( nodeVar212 * nodeVar213 );
	nodeVar215 = ( nodeVar211 + nodeVar214 );
	nodeVar216 = nodeVar215;
	nodeVar217 = ( singleScatteringDielectric + multiScatteringDielectric );
	nodeVar218 = ( vec3<f32>( 1.0 ) - nodeVar217 );
	nodeVar219 = nodeVar218;
	nodeVar220 = ( DiffuseContribution * nodeVar219 );
	nodeVar221 = ( nodeVar220 * nodeVar213 );
	nodeVar222 = nodeVar221;
	indirectSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar223 = ( indirectSpecular + nodeVar216 );
	indirectSpecular = nodeVar223;
	nodeVar224 = ( indirectDiffuse + nodeVar222 );
	indirectDiffuse = nodeVar224;
	ambientOcclusion = 1.0;
	nodeVar225 = ( indirectDiffuse * vec3<f32>( ambientOcclusion ) );
	indirectDiffuse = nodeVar225;
	nodeVar226 = dot( normalView, positionViewDirection );
	nodeVar227 = ( clamp( nodeVar226, 0.0, 1.0 ) + ambientOcclusion );
	nodeVar228 = ( Roughness * -16.0 );
	nodeVar229 = ( 1.0 - nodeVar228 );
	nodeVar230 = nodeVar229;
	nodeVar231 = ( - nodeVar230 );
	nodeVar232 = exp2( nodeVar231 );
	nodeVar233 = pow( nodeVar227, nodeVar232 );
	nodeVar234 = ( 1.0 - nodeVar233 );
	nodeVar235 = nodeVar234;
	nodeVar236 = ( ambientOcclusion - nodeVar235 );
	nodeVar237 = ( indirectSpecular * vec3<f32>( clamp( nodeVar236, 0.0, 1.0 ) ) );
	indirectSpecular = nodeVar237;
	nodeVar238 = ( directDiffuse + indirectDiffuse );
	totalDiffuse = nodeVar238;
	nodeVar239 = ( directSpecular + indirectSpecular );
	totalSpecular = nodeVar239;
	nodeVar240 = ( totalDiffuse + totalSpecular );
	outgoingLight = nodeVar240;
	Output = max( vec4<f32>( ( outgoingLight + EmissiveColor ), DiffuseColor.w ), vec4<f32>( 0.0 ) );
	nodeVar241 = ( - v_positionView.z );
	let nodeConst0 = max( ( 3.0 - v_positionWorld.y ), 0.0 );
	let nodeConst1 = ( nodeConst0 * ( - v_positionView.z ) );
	nodeVar242 = vec4<f32>( mix( Output.xyz, mix( object.nodeUniform32, object.nodeUniform33, pow( clamp( dot( normalize( ( v_positionWorld - render.cameraPosition ) ), object.nodeUniform35 ), 0.0, 1.0 ), 2.5 ) ), ( 1.0 - ( ( 1.0 - ( 1.0 - exp( ( - ( ( ( object.nodeUniform36 * object.nodeUniform36 ) * nodeVar241 ) * nodeVar241 ) ) ) ) ) * ( 1.0 - ( 1.0 - exp( ( - ( ( ( 0.0025 * 0.0025 ) * nodeConst1 ) * nodeConst1 ) ) ) ) ) ) ) ), Output.w );
	Output = nodeVar242;

	// result

	output.color = nodeVar242;

	return output;

}
