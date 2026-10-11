// Three.js r186 - Node System

// global
diagnostic( off, derivative_uniformity );


// structs

struct OutputStruct {
	@location( 0 ) color: vec4<f32>
};
var<private> output : OutputStruct;

// uniforms
@binding( 0 ) @group( 1 ) var nodeUniform0_sampler : sampler;
@binding( 1 ) @group( 1 ) var nodeUniform0 : texture_3d<f32>;
@binding( 3 ) @group( 1 ) var nodeUniform10_sampler : sampler;
@binding( 4 ) @group( 1 ) var nodeUniform10 : texture_2d<f32>;
@binding( 5 ) @group( 1 ) var nodeUniform23_sampler : sampler_comparison;
@binding( 6 ) @group( 1 ) var nodeUniform23 : texture_depth_2d;

struct renderStruct {
	cameraProjectionMatrix : mat4x4<f32>,
	cameraViewMatrix : mat4x4<f32>,
	nodeUniform12 : vec3<f32>,
	nodeUniform13 : vec3<f32>,
	nodeUniform11 : vec3<f32>,
	nodeUniform16 : vec3<f32>,
	nodeUniform19 : vec3<f32>,
	nodeUniform28 : vec3<f32>,
	nodeUniform29 : f32,
	nodeUniform30 : f32,
	nodeUniform14 : vec3<f32>,
	nodeUniform15 : vec3<f32>,
	nodeUniform17 : vec3<f32>,
	nodeUniform18 : vec3<f32>,
	nodeUniform27 : vec3<f32>,
	nodeUniform20 : mat4x4<f32>,
	nodeUniform21 : f32,
	nodeUniform22 : f32,
	nodeUniform26 : f32,
	cameraPosition : vec3<f32>,
	nodeUniform24 : f32,
	nodeUniform25 : vec2<f32>
};
@binding( 0 ) @group( 0 )
var<uniform> render : renderStruct;

struct objectStruct {
	nodeUniform1 : mat4x4<f32>,
	nodeUniform3 : mat3x3<f32>,
	nodeUniform5 : f32,
	nodeUniform6 : f32,
	nodeUniform7 : f32,
	nodeUniform8 : vec3<f32>,
	nodeUniform9 : f32,
	nodeUniform31 : vec3<f32>,
	nodeUniform32 : vec3<f32>,
	nodeUniform34 : vec3<f32>,
	nodeUniform35 : f32
};
@binding( 2 ) @group( 1 )
var<uniform> object : objectStruct;

// vars
var<private> DiffuseColor : vec4<f32>;
var<private> nodeVar0 : f32;
var<private> nodeVar1 : f32;
var<private> nodeVar2 : f32;
var<private> nodeVar3 : f32;
var<private> nodeVar4 : f32;
var<private> nodeVar5 : f32;
var<private> nodeVar6 : f32;
var<private> nodeVar7 : u32;
var<private> nodeVar8 : u32;
var<private> nodeVar9 : u32;
var<private> nodeVar10 : u32;
var<private> nodeVar11 : f32;
var<private> nodeVar12 : f32;
var<private> nodeVar13 : f32;
var<private> nodeVar14 : f32;
var<private> nodeVar15 : u32;
var<private> nodeVar16 : u32;
var<private> nodeVar17 : f32;
var<private> nodeVar18 : f32;
var<private> nodeVar19 : f32;
var<private> nodeVar20 : f32;
var<private> nodeVar21 : u32;
var<private> nodeVar22 : u32;
var<private> nodeVar23 : f32;
var<private> nodeVar24 : f32;
var<private> nodeVar25 : f32;
var<private> nodeVar26 : f32;
var<private> nodeVar27 : u32;
var<private> nodeVar28 : u32;
var<private> nodeVar29 : f32;
var<private> nodeVar30 : f32;
var<private> nodeVar31 : vec3<f32>;
var<private> nodeVar32 : f32;
var<private> normalViewGeometry : vec3<f32>;
var<private> NORMAL_normalView : vec3<f32>;
var<private> normalView : vec3<f32>;
var<private> normalWorld : vec3<f32>;
var<private> nodeVar33 : f32;
var<private> nodeVar34 : u32;
var<private> nodeVar35 : u32;
var<private> nodeVar36 : f32;
var<private> nodeVar37 : f32;
var<private> nodeVar38 : f32;
var<private> nodeVar39 : f32;
var<private> nodeVar40 : u32;
var<private> nodeVar41 : u32;
var<private> Metalness : f32;
var<private> Roughness : f32;
var<private> nodeVar42 : vec3<f32>;
var<private> SpecularColor : vec3<f32>;
var<private> SpecularColorBlended : vec3<f32>;
var<private> SpecularF90 : f32;
var<private> DiffuseContribution : vec3<f32>;
var<private> EmissiveColor : vec3<f32>;
var<private> Output : vec4<f32>;
var<private> positionViewDirection : vec3<f32>;
var<private> nodeVar43 : f32;
var<private> nodeVar44 : vec2<f32>;
var<private> nodeVar45 : f32;
var<private> nodeVar46 : f32;
var<private> nodeVar47 : f32;
var<private> nodeVar48 : f32;
var<private> nodeVar49 : vec3<f32>;
var<private> nodeVar50 : vec3<f32>;
var<private> irradiance : vec3<f32>;
var<private> nodeVar51 : f32;
var<private> nodeVar52 : f32;
var<private> nodeVar53 : f32;
var<private> nodeVar54 : vec3<f32>;
var<private> nodeVar55 : vec3<f32>;
var<private> nodeVar56 : vec3<f32>;
var<private> nodeVar57 : vec4<f32>;
var<private> nodeVar58 : vec4<f32>;
var<private> nodeVar59 : vec3<f32>;
var<private> nodeVar60 : vec3<f32>;
var<private> nodeVar61 : f32;
var<private> nodeVar62 : vec3<f32>;
var<private> nodeVar63 : vec3<f32>;
var<private> directDiffuse : vec3<f32>;
var<private> nodeVar64 : vec3<f32>;
var<private> nodeVar65 : vec3<f32>;
var<private> nodeVar66 : vec3<f32>;
var<private> nodeVar67 : vec3<f32>;
var<private> nodeVar68 : f32;
var<private> nodeVar69 : f32;
var<private> nodeVar70 : f32;
var<private> nodeVar71 : vec3<f32>;
var<private> nodeVar72 : vec3<f32>;
var<private> nodeVar73 : vec3<f32>;
var<private> nodeVar74 : vec3<f32>;
var<private> nodeVar75 : vec3<f32>;
var<private> directSpecular : vec3<f32>;
var<private> nodeVar76 : vec3<f32>;
var<private> nodeVar77 : f32;
var<private> nodeVar78 : f32;
var<private> nodeVar79 : f32;
var<private> nodeVar80 : vec3<f32>;
var<private> nodeVar81 : vec3<f32>;
var<private> nodeVar82 : vec3<f32>;
var<private> nodeVar83 : vec3<f32>;
var<private> nodeVar84 : vec3<f32>;
var<private> nodeVar85 : vec4<f32>;
var<private> nodeVar86 : vec4<f32>;
var<private> nodeVar87 : vec3<f32>;
var<private> nodeVar88 : vec3<f32>;
var<private> nodeVar89 : f32;
var<private> shadowPositionWorld : vec3<f32>;
var<private> nodeVar90 : f32;
var<private> nodeVar91 : vec4<f32>;
var<private> nodeVar92 : vec3<f32>;
var<private> nodeVar93 : vec3<f32>;
var<private> nodeVar94 : f32;
var<private> nodeVar95 : f32;
var<private> nodeVar96 : vec2<f32>;
var<private> nodeVar97 : f32;
var<private> nodeVar98 : vec2<f32>;
var<private> nodeVar99 : f32;
var<private> nodeVar100 : vec2<f32>;
var<private> nodeVar101 : f32;
var<private> nodeVar102 : vec2<f32>;
var<private> nodeVar103 : f32;
var<private> nodeVar104 : vec2<f32>;
var<private> nodeVar105 : f32;
var<private> nodeVar106 : f32;
var<private> nodeVar107 : vec3<f32>;
var<private> nodeVar108 : vec3<f32>;
var<private> nodeVar109 : vec3<f32>;
var<private> nodeVar110 : vec3<f32>;
var<private> nodeVar111 : vec3<f32>;
var<private> nodeVar112 : vec3<f32>;
var<private> nodeVar113 : f32;
var<private> nodeVar114 : f32;
var<private> nodeVar115 : f32;
var<private> nodeVar116 : vec3<f32>;
var<private> nodeVar117 : vec3<f32>;
var<private> nodeVar118 : vec3<f32>;
var<private> nodeVar119 : vec3<f32>;
var<private> nodeVar120 : vec3<f32>;
var<private> nodeVar121 : vec3<f32>;
var<private> nodeVar122 : f32;
var<private> nodeVar123 : f32;
var<private> nodeVar124 : f32;
var<private> nodeVar125 : vec3<f32>;
var<private> nodeVar126 : vec3<f32>;
var<private> nodeVar127 : vec3<f32>;
var<private> nodeVar128 : vec3<f32>;
var<private> nodeVar129 : vec3<f32>;
var<private> nodeVar130 : vec3<f32>;
var<private> nodeVar131 : f32;
var<private> nodeVar132 : f32;
var<private> nodeVar133 : f32;
var<private> nodeVar134 : f32;
var<private> nodeVar135 : f32;
var<private> nodeVar136 : vec3<f32>;
var<private> nodeVar137 : vec3<f32>;
var<private> nodeVar138 : vec3<f32>;
var<private> nodeVar139 : vec3<f32>;
var<private> nodeVar140 : vec3<f32>;
var<private> nodeVar141 : vec3<f32>;
var<private> nodeVar142 : vec3<f32>;
var<private> nodeVar143 : f32;
var<private> nodeVar144 : f32;
var<private> nodeVar145 : f32;
var<private> nodeVar146 : vec3<f32>;
var<private> nodeVar147 : vec3<f32>;
var<private> nodeVar148 : vec3<f32>;
var<private> nodeVar149 : vec3<f32>;
var<private> nodeVar150 : vec3<f32>;
var<private> nodeVar151 : vec3<f32>;
var<private> nodeVar152 : f32;
var<private> nodeVar153 : f32;
var<private> nodeVar154 : f32;
var<private> nodeVar155 : vec3<f32>;
var<private> nodeVar156 : vec3<f32>;
var<private> nodeVar157 : vec3<f32>;
var<private> nodeVar158 : vec3<f32>;
var<private> nodeVar159 : vec3<f32>;
var<private> nodeVar160 : vec3<f32>;
var<private> nodeVar161 : vec3<f32>;
var<private> nodeVar162 : f32;
var<private> nodeVar163 : vec3<f32>;
var<private> nodeVar164 : vec3<f32>;
var<private> nodeVar165 : vec3<f32>;
var<private> nodeVar166 : vec3<f32>;
var<private> nodeVar167 : vec3<f32>;
var<private> nodeVar168 : vec3<f32>;
var<private> nodeVar169 : vec3<f32>;
var<private> nodeVar170 : f32;
var<private> nodeVar171 : f32;
var<private> nodeVar172 : f32;
var<private> nodeVar173 : vec3<f32>;
var<private> nodeVar174 : vec3<f32>;
var<private> nodeVar175 : vec3<f32>;
var<private> nodeVar176 : vec3<f32>;
var<private> nodeVar177 : vec3<f32>;
var<private> nodeVar178 : vec3<f32>;
var<private> nodeVar179 : vec3<f32>;
var<private> nodeVar180 : vec3<f32>;
var<private> nodeVar181 : vec3<f32>;
var<private> nodeVar182 : vec3<f32>;
var<private> nodeVar183 : vec3<f32>;
var<private> nodeVar184 : vec3<f32>;
var<private> nodeVar185 : vec3<f32>;
var<private> indirectDiffuse : vec3<f32>;
var<private> nodeVar186 : vec3<f32>;
var<private> singleScatteringDielectric : vec3<f32>;
var<private> multiScatteringDielectric : vec3<f32>;
var<private> singleScatteringMetallic : vec3<f32>;
var<private> multiScatteringMetallic : vec3<f32>;
var<private> nodeVar187 : vec3<f32>;
var<private> nodeVar188 : f32;
var<private> nodeVar189 : vec3<f32>;
var<private> nodeVar190 : vec3<f32>;
var<private> nodeVar191 : vec3<f32>;
var<private> nodeVar192 : vec3<f32>;
var<private> nodeVar193 : vec3<f32>;
var<private> nodeVar194 : vec3<f32>;
var<private> nodeVar195 : vec3<f32>;
var<private> nodeVar196 : f32;
var<private> nodeVar197 : f32;
var<private> nodeVar198 : f32;
var<private> nodeVar199 : vec3<f32>;
var<private> nodeVar200 : vec3<f32>;
var<private> nodeVar201 : vec3<f32>;
var<private> nodeVar202 : vec3<f32>;
var<private> nodeVar203 : vec3<f32>;
var<private> nodeVar204 : vec3<f32>;
var<private> nodeVar205 : vec3<f32>;
var<private> nodeVar206 : f32;
var<private> nodeVar207 : vec3<f32>;
var<private> nodeVar208 : vec3<f32>;
var<private> nodeVar209 : vec3<f32>;
var<private> nodeVar210 : vec3<f32>;
var<private> nodeVar211 : vec3<f32>;
var<private> nodeVar212 : vec3<f32>;
var<private> nodeVar213 : vec3<f32>;
var<private> nodeVar214 : f32;
var<private> nodeVar215 : f32;
var<private> nodeVar216 : f32;
var<private> nodeVar217 : vec3<f32>;
var<private> nodeVar218 : vec3<f32>;
var<private> nodeVar219 : vec3<f32>;
var<private> nodeVar220 : vec3<f32>;
var<private> nodeVar221 : vec3<f32>;
var<private> nodeVar222 : vec3<f32>;
var<private> radiance : vec3<f32>;
var<private> nodeVar223 : vec3<f32>;
var<private> nodeVar224 : vec3<f32>;
var<private> nodeVar225 : vec3<f32>;
var<private> iblIrradiance : vec3<f32>;
var<private> nodeVar226 : vec3<f32>;
var<private> nodeVar227 : vec3<f32>;
var<private> nodeVar228 : vec3<f32>;
var<private> nodeVar229 : vec3<f32>;
var<private> nodeVar230 : vec3<f32>;
var<private> nodeVar231 : vec3<f32>;
var<private> nodeVar232 : vec3<f32>;
var<private> nodeVar233 : vec3<f32>;
var<private> nodeVar234 : vec3<f32>;
var<private> nodeVar235 : vec3<f32>;
var<private> indirectSpecular : vec3<f32>;
var<private> nodeVar236 : vec3<f32>;
var<private> nodeVar237 : vec3<f32>;
var<private> ambientOcclusion : f32;
var<private> nodeVar238 : vec3<f32>;
var<private> nodeVar239 : f32;
var<private> nodeVar240 : f32;
var<private> nodeVar241 : f32;
var<private> nodeVar242 : f32;
var<private> nodeVar243 : f32;
var<private> nodeVar244 : f32;
var<private> nodeVar245 : f32;
var<private> nodeVar246 : f32;
var<private> nodeVar247 : f32;
var<private> nodeVar248 : f32;
var<private> nodeVar249 : f32;
var<private> nodeVar250 : vec3<f32>;
var<private> totalDiffuse : vec3<f32>;
var<private> nodeVar251 : vec3<f32>;
var<private> totalSpecular : vec3<f32>;
var<private> nodeVar252 : vec3<f32>;
var<private> outgoingLight : vec3<f32>;
var<private> nodeVar253 : vec3<f32>;
var<private> nodeVar254 : f32;
var<private> nodeVar255 : vec4<f32>;

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
	@location( 4 ) nodeVarying7 : f32,
	@location( 5 ) nodeVarying8 : f32,
	@location( 6 ) nodeVarying9 : f32,
	@location( 7 ) nodeVarying10 : vec4<f32>,
	@builtin( position ) fragCoord : vec4<f32> ) -> OutputStruct {

	// flow
	// code

	nodeVar0 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( v_positionWorld * vec3<f32>( 0.55 ) ) / vec3<f32>( 8.0 ) ) ).x;
	nodeVar1 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( v_positionWorld * vec3<f32>( 2.6 ) ) / vec3<f32>( 8.0 ) ) ).x;
	nodeVar2 = ( ( ( 0.84 + ( nodeVar0 * 0.26 ) ) + ( nodeVar1 * 0.16 ) ) + ( 0.0 * 0.0 ) );
	nodeVar3 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( v_positionWorld * vec3<f32>( 23.0 ) ) / vec3<f32>( 8.0 ) ) ).x;
	nodeVar4 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( v_positionWorld * vec3<f32>( 0.3 ) ) / vec3<f32>( 8.0 ) ) ).x;
	nodeVar5 = ( ( ( ( v_positionWorld.y * 0.85 ) + ( nodeVar4 * 0.7 ) ) + ( v_positionWorld.x * 0.05 ) ) - ( v_positionWorld.z * 0.04 ) );
	nodeVar6 = floor( nodeVar5 );
	nodeVar7 = ( ( u32( ( nodeVar6 + 90.0 ) ) * 747796405u ) + 2891336453u );
	nodeVar8 = ( ( ( nodeVar7 >> ( ( nodeVar7 >> 28u ) + 4u ) ) ^ nodeVar7 ) * 277803737u );
	nodeVar9 = ( ( u32( ( nodeVar6 + 91.0 ) ) * 747796405u ) + 2891336453u );
	nodeVar10 = ( ( ( nodeVar9 >> ( ( nodeVar9 >> 28u ) + 4u ) ) ^ nodeVar9 ) * 277803737u );
	nodeVar11 = ( f32( ( ( nodeVar10 >> 22u ) ^ nodeVar10 ) ) * 2.3283064365386963e-10 );
	nodeVar12 = fwidth( nodeVar5 );
	nodeVar13 = min( max( ( nodeVar12 * 1.5 ), 0.16 ), 0.5 );
	nodeVar14 = fract( nodeVar5 );
	nodeVar15 = ( ( u32( ( nodeVar6 + 17.0 ) ) * 747796405u ) + 2891336453u );
	nodeVar16 = ( ( ( nodeVar15 >> ( ( nodeVar15 >> 28u ) + 4u ) ) ^ nodeVar15 ) * 277803737u );
	nodeVar17 = ( f32( ( ( nodeVar16 >> 22u ) ^ nodeVar16 ) ) * 2.3283064365386963e-10 );
	nodeVar18 = ( ( ( ( ( v_positionWorld.x * 0.8 ) + ( v_positionWorld.z * 0.6 ) ) + ( nodeVar4 * 1.4 ) ) + ( nodeVar17 * 9.0 ) ) + ( ( nodeVar14 * ( nodeVar11 - 0.5 ) ) * 2.4 ) );
	nodeVar19 = ( ( nodeVar11 * 2.6 ) + 2.2 );
	nodeVar20 = ( nodeVar18 / nodeVar19 );
	nodeVar21 = ( ( u32( ( ( floor( nodeVar20 ) + ( nodeVar6 * 31.0 ) ) + 1000.0 ) ) * 747796405u ) + 2891336453u );
	nodeVar22 = ( ( ( nodeVar21 >> ( ( nodeVar21 >> 28u ) + 4u ) ) ^ nodeVar21 ) * 277803737u );
	nodeVar23 = max( 0.12, ( fwidth( nodeVar18 ) * 1.5 ) );
	nodeVar24 = fract( nodeVar20 );
	nodeVar25 = ( min( nodeVar24, ( 1.0 - nodeVar24 ) ) * nodeVar19 );
	nodeVar26 = ( smoothstep( 0.0, nodeVar13, nodeVar14 ) * smoothstep( 1.0, ( 1.0 - nodeVar13 ), nodeVar14 ) );
	nodeVar27 = ( ( u32( ( nodeVar6 + 16.0 ) ) * 747796405u ) + 2891336453u );
	nodeVar28 = ( ( ( nodeVar27 >> ( ( nodeVar27 >> 28u ) + 4u ) ) ^ nodeVar27 ) * 277803737u );
	nodeVar29 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( v_positionWorld * vec3<f32>( 5.3 ) ) / vec3<f32>( 8.0 ) ) ).x;
	nodeVar30 = max( 0.1, ( nodeVar12 * 1.5 ) );
	nodeVar31 = ( ( mix( vec3<f32>( 0.88, 0.94, 1.04 ), vec3<f32>( 1.04, 1.0, 0.92 ), mix( ( f32( ( ( nodeVar8 >> 22u ) ^ nodeVar8 ) ) * 2.3283064365386963e-10 ), nodeVar11, smoothstep( 0.0, nodeVar13, nodeVar14 ) ) ) * vec3<f32>( max( ( ( ( ( ( ( 0.7 + ( mix( 0.5, ( f32( ( ( nodeVar22 >> 22u ) ^ nodeVar22 ) ) * 2.3283064365386963e-10 ), ( smoothstep( 0.0, nodeVar23, nodeVar25 ) * nodeVar26 ) ) * 0.45 ) ) + ( mix( ( f32( ( ( nodeVar28 >> 22u ) ^ nodeVar28 ) ) * 2.3283064365386963e-10 ), nodeVar17, smoothstep( 0.0, nodeVar13, nodeVar14 ) ) * 0.2 ) ) + ( nodeVar4 * 0.18 ) ) + ( nodeVar29 * 0.1 ) ) - ( ( 1.0 - smoothstep( 0.5, 1.0, 0.6 ) ) * 0.08 ) ) - ( smoothstep( 0.1, 0.7, -1.0 ) * 0.2 ) ), 0.12 ) ) ) * vec3<f32>( ( ( ( 1.0 - ( ( 1.0 - ( smoothstep( 0.0, nodeVar30, nodeVar14 ) * smoothstep( 1.0, ( 1.0 - nodeVar30 ), nodeVar14 ) ) ) * 0.35 ) ) * ( 1.0 - ( ( ( ( 1.0 - smoothstep( 0.02, nodeVar23, nodeVar25 ) ) * smoothstep( 0.3, 0.55, nodeVar17 ) ) * nodeVar26 ) * 0.4 ) ) ) * ( 1.0 - ( 0.0 * 0.45 ) ) ) ) );
	nodeVar32 = smoothstep( 0.2, 0.55, ( nodeVar4 + ( nodeVar29 * 0.5 ) ) );
	normalViewGeometry = normalize( v_normalViewGeometry );
	NORMAL_normalView = normalViewGeometry;
	normalView = NORMAL_normalView;
	normalWorld = normalize( ( vec4<f32>( normalView, 0.0 ) * render.cameraViewMatrix ).xyz );
	nodeVar33 = floor( ( v_positionWorld.xz.y / 0.68 ) );
	nodeVar34 = ( ( u32( nodeVar33 ) * 747796405u ) + 2891336453u );
	nodeVar35 = ( ( ( nodeVar34 >> ( ( nodeVar34 >> 28u ) + 4u ) ) ^ nodeVar34 ) * 277803737u );
	nodeVar36 = ( v_positionWorld.xz.x + ( ( f32( ( ( nodeVar35 >> 22u ) ^ nodeVar35 ) ) * 2.3283064365386963e-10 ) * 1.15 ) );
	nodeVar37 = fract( ( nodeVar36 / 1.15 ) );
	nodeVar38 = fract( ( v_positionWorld.xz.y / 0.68 ) );
	nodeVar39 = min( ( min( nodeVar37, ( 1.0 - nodeVar37 ) ) * 1.15 ), ( min( nodeVar38, ( 1.0 - nodeVar38 ) ) * 0.68 ) );
	nodeVar40 = ( ( u32( ( floor( ( nodeVar36 / 1.15 ) ) + ( nodeVar33 * 57.0 ) ) ) * 747796405u ) + 2891336453u );
	nodeVar41 = ( ( ( nodeVar40 >> ( ( nodeVar40 >> 28u ) + 4u ) ) ^ nodeVar40 ) * 277803737u );
	DiffuseColor = ( vec4<f32>( mix( ( vec3<f32>( ( ( nodeVar2 * ( ( ( 1.0 - ( ( smoothstep( 0.25, 0.6, nodeVarying7 ) * ( 1.0 - smoothstep( 0.6, 0.95, nodeVarying7 ) ) ) * 0.22 ) ) + ( ( smoothstep( 0.35, 0.6, nodeVar3 ) * nodeVarying7 ) * 0.45 ) ) - ( ( nodeVar1 * nodeVarying7 ) * 0.12 ) ) ) * ( 1.0 - ( ( smoothstep( 0.0, 0.3, nodeVarying7 ) * ( 1.0 - smoothstep( 0.3, 0.6, nodeVarying7 ) ) ) * 0.12 ) ) ) ) * mix( vec3<f32>( 1.0, 1.0, 1.0 ), mix( mix( nodeVar31, ( ( nodeVar31 * vec3<f32>( 0.82, 0.9, 1.0 ) ) * vec3<f32>( 0.82 ) ), ( nodeVarying8 * 0.7 ) ), ( vec3<f32>( 0.82, 0.88, 0.72 ) * vec3<f32>( 0.8 ) ), min( ( ( ( ( ( ( smoothstep( 0.45, 0.75, nodeVar14 ) * smoothstep( 1.0, 0.9, nodeVar14 ) ) * nodeVar32 ) * ( 0.35 + smoothstep( 0.0, 0.5, normalWorld.y ) ) ) * nodeVar26 ) * 0.4 ) + ( ( nodeVarying8 * nodeVar32 ) * 0.12 ) ), 0.45 ) ), smoothstep( 0.93, 0.74, normalWorld.y ) ) ), ( vec3<f32>( ( ( ( mix( 0.55, 1.0, smoothstep( 0.012, 0.06, nodeVar39 ) ) * ( ( ( f32( ( ( nodeVar41 >> 22u ) ^ nodeVar41 ) ) * 2.3283064365386963e-10 ) * 0.55 ) + 0.7 ) ) * ( ( smoothstep( 0.0, 0.2, nodeVar39 ) * 0.18 ) + 0.82 ) ) * ( ( nodeVar2 * 0.5 ) + 0.5 ) ) ) * vec3<f32>( 1.0, 1.0, 1.0 ) ), ( nodeVarying9 * smoothstep( -0.5, 0.2, nodeVar0 ) ) ), 1.0 ) * nodeVarying10 );
	DiffuseColor.w = ( DiffuseColor.w * object.nodeUniform5 );
	DiffuseColor.w = 1.0;
	Metalness = object.nodeUniform6;
	nodeVar42 = max( abs( dpdx( normalViewGeometry ) ), abs( - dpdy( normalViewGeometry ) ) );
	Roughness = min( ( max( object.nodeUniform7, 0.0525 ) + max( max( nodeVar42.x, nodeVar42.y ), nodeVar42.z ) ), 1.0 );
	SpecularColor = vec3<f32>( 0.04, 0.04, 0.04 );
	SpecularColorBlended = mix( vec3<f32>( 0.04, 0.04, 0.04 ), DiffuseColor.xyz, Metalness );
	SpecularF90 = 1.0;
	DiffuseContribution = ( DiffuseColor.xyz * vec3<f32>( ( 1.0 - object.nodeUniform6 ) ) );
	EmissiveColor = ( object.nodeUniform8 * vec3<f32>( object.nodeUniform9 ) );
	positionViewDirection = normalize( v_positionViewDirection );
	nodeVar43 = dot( normalView, positionViewDirection );
	nodeVar44 = textureSample( nodeUniform10, nodeUniform10_sampler, vec2<f32>( Roughness, clamp( nodeVar43, 0.0, 1.0 ) ) ).xy;
	let dfg = nodeVar44;
	nodeVar45 = ( dfg.x + dfg.y );
	nodeVar46 = ( 1.0 / nodeVar45 );
	nodeVar47 = nodeVar46;
	nodeVar48 = ( nodeVar47 - 1.0 );
	nodeVar49 = ( SpecularColorBlended * vec3<f32>( nodeVar48 ) );
	nodeVar50 = ( nodeVar49 + vec3<f32>( 1.0 ) );
	let multiScatteringCompensation = nodeVar50;
	irradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar51 = dot( normalWorld, normalize( render.nodeUniform13 ) );
	nodeVar52 = ( nodeVar51 * 0.5 );
	nodeVar53 = ( nodeVar52 + 0.5 );
	nodeVar54 = mix( render.nodeUniform11, render.nodeUniform12, nodeVar53 );
	nodeVar55 = ( irradiance + nodeVar54 );
	irradiance = nodeVar55;
	nodeVar56 = ( render.nodeUniform14 - render.nodeUniform15 );
	nodeVar57 = vec4<f32>( nodeVar56, 0.0 );
	nodeVar58 = ( render.cameraViewMatrix * nodeVar57 );
	nodeVar59 = normalize( nodeVar58.xyz );
	nodeVar60 = nodeVar59;
	nodeVar61 = dot( normalView, nodeVar60 );
	nodeVar62 = ( vec3<f32>( clamp( nodeVar61, 0.0, 1.0 ) ) * render.nodeUniform16 );
	nodeVar63 = nodeVar62;
	directDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar64 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar65 = ( nodeVar63 * nodeVar64 );
	nodeVar66 = ( nodeVar60 + positionViewDirection );
	nodeVar67 = normalize( nodeVar66 );
	nodeVar68 = dot( positionViewDirection, nodeVar67 );
	nodeVar69 = clamp( nodeVar68, 0.0, 1.0 );
	nodeVar70 = exp2( ( ( ( nodeVar69 * -5.55473 ) - 6.98316 ) * nodeVar69 ) );
	nodeVar71 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar70 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar70 ) ) );
	nodeVar72 = ( vec3<f32>( 1.0 ) - nodeVar71 );
	nodeVar73 = nodeVar72;
	nodeVar74 = ( nodeVar65 * nodeVar73 );
	nodeVar75 = ( directDiffuse + nodeVar74 );
	directDiffuse = nodeVar75;
	directSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar76 = normalize( ( nodeVar60 + positionViewDirection ) );
	nodeVar77 = clamp( dot( positionViewDirection, nodeVar76 ), 0.0, 1.0 );
	nodeVar78 = exp2( ( ( ( nodeVar77 * -5.55473 ) - 6.98316 ) * nodeVar77 ) );
	nodeVar79 = ( Roughness * Roughness );
	nodeVar80 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar78 ) ) ) + vec3<f32>( ( 1.0 * nodeVar78 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar79, clamp( dot( normalView, nodeVar60 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar79, clamp( dot( normalView, nodeVar76 ), 0.0, 1.0 ) ) ) );
	nodeVar81 = ( nodeVar63 * nodeVar80 );
	nodeVar82 = ( nodeVar81 * multiScatteringCompensation );
	nodeVar83 = ( directSpecular + nodeVar82 );
	directSpecular = nodeVar83;
	nodeVar84 = ( render.nodeUniform17 - render.nodeUniform18 );
	nodeVar85 = vec4<f32>( nodeVar84, 0.0 );
	nodeVar86 = ( render.cameraViewMatrix * nodeVar85 );
	nodeVar87 = normalize( nodeVar86.xyz );
	nodeVar88 = nodeVar87;
	nodeVar89 = dot( normalView, nodeVar88 );
	shadowPositionWorld = v_positionWorld;
	nodeVar91 = ( render.nodeUniform20 * vec4<f32>( ( shadowPositionWorld + ( normalWorld * vec3<f32>( render.nodeUniform21 ) ) ), 1.0 ) );
	nodeVar92 = ( nodeVar91.xyz / vec3<f32>( nodeVar91.w ) );
	nodeVar93 = vec3<f32>( nodeVar92.x, ( 1.0 - nodeVar92.y ), ( nodeVar92.z + render.nodeUniform22 ) );

	if ( ( ( ( ( ( nodeVar93.x >= 0.0 ) && ( nodeVar93.x <= 1.0 ) ) && ( nodeVar93.y >= 0.0 ) ) && ( nodeVar93.y <= 1.0 ) ) && ( nodeVar93.z <= 1.0 ) ) ) {

		nodeVar94 = ( interleavedGradientNoise( fragCoord.xy ) * 6.28318530718 );
		nodeVar95 = ( render.nodeUniform24 * ( vec2<f32>( 1.0, 1.0 ) / render.nodeUniform25 ).x );
		nodeVar96 = ( nodeVar93.xy + ( vogelDiskSample( 0, 5, nodeVar94 ) * vec2<f32>( nodeVar95 ) ) );
		nodeVar97 = textureSampleCompare( nodeUniform23, nodeUniform23_sampler, nodeVar96, nodeVar93.z );
		nodeVar98 = ( nodeVar93.xy + ( vogelDiskSample( 1, 5, nodeVar94 ) * vec2<f32>( nodeVar95 ) ) );
		nodeVar99 = textureSampleCompare( nodeUniform23, nodeUniform23_sampler, nodeVar98, nodeVar93.z );
		nodeVar100 = ( nodeVar93.xy + ( vogelDiskSample( 2, 5, nodeVar94 ) * vec2<f32>( nodeVar95 ) ) );
		nodeVar101 = textureSampleCompare( nodeUniform23, nodeUniform23_sampler, nodeVar100, nodeVar93.z );
		nodeVar102 = ( nodeVar93.xy + ( vogelDiskSample( 3, 5, nodeVar94 ) * vec2<f32>( nodeVar95 ) ) );
		nodeVar103 = textureSampleCompare( nodeUniform23, nodeUniform23_sampler, nodeVar102, nodeVar93.z );
		nodeVar104 = ( nodeVar93.xy + ( vogelDiskSample( 4, 5, nodeVar94 ) * vec2<f32>( nodeVar95 ) ) );
		nodeVar105 = textureSampleCompare( nodeUniform23, nodeUniform23_sampler, nodeVar104, nodeVar93.z );
		nodeVar90 = ( ( ( ( ( nodeVar97 + nodeVar99 ) + nodeVar101 ) + nodeVar103 ) + nodeVar105 ) * 0.2 );

	} else {

		nodeVar90 = 1.0;

	}

	nodeVar106 = mix( 1.0, nodeVar90, render.nodeUniform26 );
	nodeVar107 = ( vec3<f32>( clamp( nodeVar89, 0.0, 1.0 ) ) * ( render.nodeUniform19 * vec3<f32>( nodeVar106 ) ) );
	nodeVar108 = nodeVar107;
	nodeVar109 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar110 = ( nodeVar108 * nodeVar109 );
	nodeVar111 = ( nodeVar88 + positionViewDirection );
	nodeVar112 = normalize( nodeVar111 );
	nodeVar113 = dot( positionViewDirection, nodeVar112 );
	nodeVar114 = clamp( nodeVar113, 0.0, 1.0 );
	nodeVar115 = exp2( ( ( ( nodeVar114 * -5.55473 ) - 6.98316 ) * nodeVar114 ) );
	nodeVar116 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar115 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar115 ) ) );
	nodeVar117 = ( vec3<f32>( 1.0 ) - nodeVar116 );
	nodeVar118 = nodeVar117;
	nodeVar119 = ( nodeVar110 * nodeVar118 );
	nodeVar120 = ( directDiffuse + nodeVar119 );
	directDiffuse = nodeVar120;
	nodeVar121 = normalize( ( nodeVar88 + positionViewDirection ) );
	nodeVar122 = clamp( dot( positionViewDirection, nodeVar121 ), 0.0, 1.0 );
	nodeVar123 = exp2( ( ( ( nodeVar122 * -5.55473 ) - 6.98316 ) * nodeVar122 ) );
	nodeVar124 = ( Roughness * Roughness );
	nodeVar125 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar123 ) ) ) + vec3<f32>( ( 1.0 * nodeVar123 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar124, clamp( dot( normalView, nodeVar88 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar124, clamp( dot( normalView, nodeVar121 ), 0.0, 1.0 ) ) ) );
	nodeVar126 = ( nodeVar108 * nodeVar125 );
	nodeVar127 = ( nodeVar126 * multiScatteringCompensation );
	nodeVar128 = ( directSpecular + nodeVar127 );
	directSpecular = nodeVar128;
	nodeVar129 = ( render.nodeUniform27 - v_positionView );
	nodeVar130 = normalize( nodeVar129 );
	nodeVar131 = dot( normalView, nodeVar130 );

	if ( ( render.nodeUniform29 > 0.0 ) ) {

		nodeVar133 = length( nodeVar129 );
		nodeVar134 = ( nodeVar133 / render.nodeUniform29 );
		nodeVar135 = clamp( ( 1.0 - ( ( ( nodeVar134 * nodeVar134 ) * nodeVar134 ) * nodeVar134 ) ), 0.0, 1.0 );
		nodeVar132 = ( ( 1.0 / max( pow( nodeVar133, render.nodeUniform30 ), 0.01 ) ) * ( nodeVar135 * nodeVar135 ) );

	} else {

		nodeVar132 = ( 1.0 / max( pow( length( nodeVar129 ), render.nodeUniform30 ), 0.01 ) );

	}

	nodeVar136 = ( render.nodeUniform28 * vec3<f32>( nodeVar132 ) );
	nodeVar137 = ( vec3<f32>( clamp( nodeVar131, 0.0, 1.0 ) ) * nodeVar136 );
	nodeVar138 = nodeVar137;
	nodeVar139 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar140 = ( nodeVar138 * nodeVar139 );
	nodeVar141 = ( nodeVar130 + positionViewDirection );
	nodeVar142 = normalize( nodeVar141 );
	nodeVar143 = dot( positionViewDirection, nodeVar142 );
	nodeVar144 = clamp( nodeVar143, 0.0, 1.0 );
	nodeVar145 = exp2( ( ( ( nodeVar144 * -5.55473 ) - 6.98316 ) * nodeVar144 ) );
	nodeVar146 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar145 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar145 ) ) );
	nodeVar147 = ( vec3<f32>( 1.0 ) - nodeVar146 );
	nodeVar148 = nodeVar147;
	nodeVar149 = ( nodeVar140 * nodeVar148 );
	nodeVar150 = ( directDiffuse + nodeVar149 );
	directDiffuse = nodeVar150;
	nodeVar151 = normalize( ( nodeVar130 + positionViewDirection ) );
	nodeVar152 = clamp( dot( positionViewDirection, nodeVar151 ), 0.0, 1.0 );
	nodeVar153 = exp2( ( ( ( nodeVar152 * -5.55473 ) - 6.98316 ) * nodeVar152 ) );
	nodeVar154 = ( Roughness * Roughness );
	nodeVar155 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar153 ) ) ) + vec3<f32>( ( 1.0 * nodeVar153 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar154, clamp( dot( normalView, nodeVar130 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar154, clamp( dot( normalView, nodeVar151 ), 0.0, 1.0 ) ) ) );
	nodeVar156 = ( nodeVar138 * nodeVar155 );
	nodeVar157 = ( nodeVar156 * multiScatteringCompensation );
	nodeVar158 = ( directSpecular + nodeVar157 );
	directSpecular = nodeVar158;
	nodeVar159 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar160 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar161 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar162 = ( SpecularF90 * dfg.y );
	nodeVar163 = ( nodeVar161 + vec3<f32>( nodeVar162 ) );
	nodeVar164 = ( nodeVar159 + nodeVar163 );
	nodeVar159 = nodeVar164;
	nodeVar165 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar166 = nodeVar165;
	nodeVar167 = ( nodeVar166 * vec3<f32>( 0.047619 ) );
	nodeVar168 = ( SpecularColor + nodeVar167 );
	nodeVar169 = ( nodeVar163 * nodeVar168 );
	nodeVar170 = ( dfg.x + dfg.y );
	nodeVar171 = ( 1.0 - nodeVar170 );
	nodeVar172 = nodeVar171;
	nodeVar173 = ( vec3<f32>( nodeVar172 ) * nodeVar168 );
	nodeVar174 = ( vec3<f32>( 1.0 ) - nodeVar173 );
	nodeVar175 = nodeVar174;
	nodeVar176 = ( nodeVar169 / nodeVar175 );
	nodeVar177 = ( nodeVar176 * vec3<f32>( nodeVar172 ) );
	nodeVar178 = ( nodeVar160 + nodeVar177 );
	nodeVar160 = nodeVar178;
	nodeVar179 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar180 = ( irradiance * nodeVar179 );
	nodeVar181 = ( nodeVar159 + nodeVar160 );
	nodeVar182 = ( vec3<f32>( 1.0 ) - nodeVar181 );
	nodeVar183 = nodeVar182;
	nodeVar184 = ( nodeVar180 * nodeVar183 );
	nodeVar185 = nodeVar184;
	indirectDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar186 = ( indirectDiffuse + nodeVar185 );
	indirectDiffuse = nodeVar186;
	singleScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	singleScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar187 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar188 = ( SpecularF90 * dfg.y );
	nodeVar189 = ( nodeVar187 + vec3<f32>( nodeVar188 ) );
	nodeVar190 = ( singleScatteringDielectric + nodeVar189 );
	singleScatteringDielectric = nodeVar190;
	nodeVar191 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar192 = nodeVar191;
	nodeVar193 = ( nodeVar192 * vec3<f32>( 0.047619 ) );
	nodeVar194 = ( SpecularColor + nodeVar193 );
	nodeVar195 = ( nodeVar189 * nodeVar194 );
	nodeVar196 = ( dfg.x + dfg.y );
	nodeVar197 = ( 1.0 - nodeVar196 );
	nodeVar198 = nodeVar197;
	nodeVar199 = ( vec3<f32>( nodeVar198 ) * nodeVar194 );
	nodeVar200 = ( vec3<f32>( 1.0 ) - nodeVar199 );
	nodeVar201 = nodeVar200;
	nodeVar202 = ( nodeVar195 / nodeVar201 );
	nodeVar203 = ( nodeVar202 * vec3<f32>( nodeVar198 ) );
	nodeVar204 = ( multiScatteringDielectric + nodeVar203 );
	multiScatteringDielectric = nodeVar204;
	nodeVar205 = ( DiffuseColor.xyz * vec3<f32>( dfg.x ) );
	nodeVar206 = ( SpecularF90 * dfg.y );
	nodeVar207 = ( nodeVar205 + vec3<f32>( nodeVar206 ) );
	nodeVar208 = ( singleScatteringMetallic + nodeVar207 );
	singleScatteringMetallic = nodeVar208;
	nodeVar209 = ( vec3<f32>( 1.0 ) - DiffuseColor.xyz );
	nodeVar210 = nodeVar209;
	nodeVar211 = ( nodeVar210 * vec3<f32>( 0.047619 ) );
	nodeVar212 = ( DiffuseColor.xyz + nodeVar211 );
	nodeVar213 = ( nodeVar207 * nodeVar212 );
	nodeVar214 = ( dfg.x + dfg.y );
	nodeVar215 = ( 1.0 - nodeVar214 );
	nodeVar216 = nodeVar215;
	nodeVar217 = ( vec3<f32>( nodeVar216 ) * nodeVar212 );
	nodeVar218 = ( vec3<f32>( 1.0 ) - nodeVar217 );
	nodeVar219 = nodeVar218;
	nodeVar220 = ( nodeVar213 / nodeVar219 );
	nodeVar221 = ( nodeVar220 * vec3<f32>( nodeVar216 ) );
	nodeVar222 = ( multiScatteringMetallic + nodeVar221 );
	multiScatteringMetallic = nodeVar222;
	radiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar223 = mix( singleScatteringDielectric, singleScatteringMetallic, Metalness );
	nodeVar224 = ( radiance * nodeVar223 );
	nodeVar225 = mix( multiScatteringDielectric, multiScatteringMetallic, Metalness );
	iblIrradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar226 = ( iblIrradiance * vec3<f32>( 0.3183098861837907 ) );
	nodeVar227 = ( nodeVar225 * nodeVar226 );
	nodeVar228 = ( nodeVar224 + nodeVar227 );
	nodeVar229 = nodeVar228;
	nodeVar230 = ( singleScatteringDielectric + multiScatteringDielectric );
	nodeVar231 = ( vec3<f32>( 1.0 ) - nodeVar230 );
	nodeVar232 = nodeVar231;
	nodeVar233 = ( DiffuseContribution * nodeVar232 );
	nodeVar234 = ( nodeVar233 * nodeVar226 );
	nodeVar235 = nodeVar234;
	indirectSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar236 = ( indirectSpecular + nodeVar229 );
	indirectSpecular = nodeVar236;
	nodeVar237 = ( indirectDiffuse + nodeVar235 );
	indirectDiffuse = nodeVar237;
	ambientOcclusion = 1.0;
	nodeVar238 = ( indirectDiffuse * vec3<f32>( ambientOcclusion ) );
	indirectDiffuse = nodeVar238;
	nodeVar239 = dot( normalView, positionViewDirection );
	nodeVar240 = ( clamp( nodeVar239, 0.0, 1.0 ) + ambientOcclusion );
	nodeVar241 = ( Roughness * -16.0 );
	nodeVar242 = ( 1.0 - nodeVar241 );
	nodeVar243 = nodeVar242;
	nodeVar244 = ( - nodeVar243 );
	nodeVar245 = exp2( nodeVar244 );
	nodeVar246 = pow( nodeVar240, nodeVar245 );
	nodeVar247 = ( 1.0 - nodeVar246 );
	nodeVar248 = nodeVar247;
	nodeVar249 = ( ambientOcclusion - nodeVar248 );
	nodeVar250 = ( indirectSpecular * vec3<f32>( clamp( nodeVar249, 0.0, 1.0 ) ) );
	indirectSpecular = nodeVar250;
	nodeVar251 = ( directDiffuse + indirectDiffuse );
	totalDiffuse = nodeVar251;
	nodeVar252 = ( directSpecular + indirectSpecular );
	totalSpecular = nodeVar252;
	nodeVar253 = ( totalDiffuse + totalSpecular );
	outgoingLight = nodeVar253;
	Output = max( vec4<f32>( ( outgoingLight + EmissiveColor ), DiffuseColor.w ), vec4<f32>( 0.0 ) );
	nodeVar254 = ( - v_positionView.z );
	let nodeConst0 = max( ( 3.0 - v_positionWorld.y ), 0.0 );
	let nodeConst1 = ( nodeConst0 * ( - v_positionView.z ) );
	nodeVar255 = vec4<f32>( mix( Output.xyz, mix( object.nodeUniform31, object.nodeUniform32, pow( clamp( dot( normalize( ( v_positionWorld - render.cameraPosition ) ), object.nodeUniform34 ), 0.0, 1.0 ), 2.5 ) ), ( 1.0 - ( ( 1.0 - ( 1.0 - exp( ( - ( ( ( object.nodeUniform35 * object.nodeUniform35 ) * nodeVar254 ) * nodeVar254 ) ) ) ) ) * ( 1.0 - ( 1.0 - exp( ( - ( ( ( 0.0025 * 0.0025 ) * nodeConst1 ) * nodeConst1 ) ) ) ) ) ) ) ), Output.w );
	Output = nodeVar255;

	// result

	output.color = nodeVar255;

	return output;

}
