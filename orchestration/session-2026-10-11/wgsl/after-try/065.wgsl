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
@binding( 4 ) @group( 1 ) var nodeUniform9_sampler : sampler;
@binding( 5 ) @group( 1 ) var nodeUniform9 : texture_2d<f32>;
@binding( 6 ) @group( 1 ) var nodeUniform22_sampler : sampler_comparison;
@binding( 7 ) @group( 1 ) var nodeUniform22 : texture_depth_2d;

struct NodeBuffer_8578Struct {
	value : array< vec4<f32>, 7 >
};
@binding( 3 ) @group( 1 )
var<uniform> NodeBuffer_8578 : NodeBuffer_8578Struct;

struct objectStruct {
	nodeUniform1 : f32,
	nodeUniform2 : f32,
	nodeUniform4 : mat3x3<f32>,
	nodeUniform6 : mat4x4<f32>,
	nodeUniform30 : vec3<f32>,
	nodeUniform31 : vec3<f32>,
	nodeUniform33 : vec3<f32>,
	nodeUniform34 : f32
};
@binding( 2 ) @group( 1 )
var<uniform> object : objectStruct;

struct renderStruct {
	nodeUniform8 : f32,
	cameraProjectionMatrix : mat4x4<f32>,
	cameraViewMatrix : mat4x4<f32>,
	nodeUniform11 : vec3<f32>,
	nodeUniform12 : vec3<f32>,
	nodeUniform10 : vec3<f32>,
	nodeUniform15 : vec3<f32>,
	nodeUniform18 : vec3<f32>,
	nodeUniform27 : vec3<f32>,
	nodeUniform28 : f32,
	nodeUniform29 : f32,
	nodeUniform13 : vec3<f32>,
	nodeUniform14 : vec3<f32>,
	nodeUniform16 : vec3<f32>,
	nodeUniform17 : vec3<f32>,
	nodeUniform26 : vec3<f32>,
	nodeUniform19 : mat4x4<f32>,
	nodeUniform20 : f32,
	nodeUniform21 : f32,
	nodeUniform25 : f32,
	cameraPosition : vec3<f32>,
	nodeUniform23 : f32,
	nodeUniform24 : vec2<f32>
};
@binding( 0 ) @group( 0 )
var<uniform> render : renderStruct;

// vars
var<private> DiffuseColor : vec4<f32>;
var<private> nodeVar0 : f32;
var<private> nodeVar1 : u32;
var<private> nodeVar2 : u32;
var<private> nodeVar3 : f32;
var<private> nodeVar4 : f32;
var<private> nodeVar5 : f32;
var<private> nodeVar6 : f32;
var<private> nodeVar7 : u32;
var<private> nodeVar8 : u32;
var<private> nodeVar9 : f32;
var<private> nodeVar10 : f32;
var<private> nodeVar11 : u32;
var<private> nodeVar12 : u32;
var<private> nodeVar13 : f32;
var<private> nodeVar14 : f32;
var<private> nodeVar15 : f32;
var<private> nodeVar16 : u32;
var<private> nodeVar17 : u32;
var<private> nodeVar18 : f32;
var<private> nodeVar19 : u32;
var<private> nodeVar20 : u32;
var<private> nodeVar21 : f32;
var<private> nodeVar22 : f32;
var<private> nodeVar23 : f32;
var<private> nodeVar24 : f32;
var<private> nodeVar25 : f32;
var<private> nodeVar26 : f32;
var<private> nodeVar27 : f32;
var<private> nodeVar28 : f32;
var<private> nodeVar29 : f32;
var<private> nodeVar30 : f32;
var<private> nodeVar31 : f32;
var<private> nodeVar32 : f32;
var<private> nodeVar33 : f32;
var<private> nodeVar34 : f32;
var<private> nodeVar35 : f32;
var<private> nodeVar36 : vec3<f32>;
var<private> Metalness : f32;
var<private> Roughness : f32;
var<private> normalViewGeometry : vec3<f32>;
var<private> nodeVar37 : vec3<f32>;
var<private> SpecularColor : vec3<f32>;
var<private> SpecularColorBlended : vec3<f32>;
var<private> SpecularF90 : f32;
var<private> DiffuseContribution : vec3<f32>;
var<private> EmissiveColor : vec3<f32>;
var<private> nodeVar38 : vec3<f32>;
var<private> nodeVar39 : f32;
var<private> nodeVar40 : vec3<f32>;
var<private> nodeVar41 : vec3<f32>;
var<private> NORMAL_normalView : vec3<f32>;
var<private> NORMAL_nodeVar42 : vec3<f32>;
var<private> NORMAL_nodeVar43 : f32;
var<private> nodeVar44 : f32;
var<private> nodeVar45 : vec3<f32>;
var<private> normalView : vec3<f32>;
var<private> normalWorld : vec3<f32>;
var<private> nodeVar46 : vec3<f32>;
var<private> nodeVar47 : f32;
var<private> nodeVar48 : vec3<f32>;
var<private> nodeVar49 : f32;
var<private> nodeVar50 : vec3<f32>;
var<private> nodeVar51 : f32;
var<private> nodeVar52 : vec3<f32>;
var<private> nodeVar53 : f32;
var<private> nodeVar54 : vec3<f32>;
var<private> nodeVar55 : f32;
var<private> nodeVar56 : vec3<f32>;
var<private> nodeVar57 : f32;
var<private> Output : vec4<f32>;
var<private> positionViewDirection : vec3<f32>;
var<private> nodeVar58 : f32;
var<private> nodeVar59 : vec2<f32>;
var<private> nodeVar60 : f32;
var<private> nodeVar61 : f32;
var<private> nodeVar62 : f32;
var<private> nodeVar63 : f32;
var<private> nodeVar64 : vec3<f32>;
var<private> nodeVar65 : vec3<f32>;
var<private> irradiance : vec3<f32>;
var<private> nodeVar66 : f32;
var<private> nodeVar67 : f32;
var<private> nodeVar68 : f32;
var<private> nodeVar69 : vec3<f32>;
var<private> nodeVar70 : vec3<f32>;
var<private> nodeVar71 : vec3<f32>;
var<private> nodeVar72 : vec4<f32>;
var<private> nodeVar73 : vec4<f32>;
var<private> nodeVar74 : vec3<f32>;
var<private> nodeVar75 : vec3<f32>;
var<private> nodeVar76 : f32;
var<private> nodeVar77 : vec3<f32>;
var<private> nodeVar78 : vec3<f32>;
var<private> directDiffuse : vec3<f32>;
var<private> nodeVar79 : vec3<f32>;
var<private> nodeVar80 : vec3<f32>;
var<private> nodeVar81 : vec3<f32>;
var<private> nodeVar82 : vec3<f32>;
var<private> nodeVar83 : f32;
var<private> nodeVar84 : f32;
var<private> nodeVar85 : f32;
var<private> nodeVar86 : vec3<f32>;
var<private> nodeVar87 : vec3<f32>;
var<private> nodeVar88 : vec3<f32>;
var<private> nodeVar89 : vec3<f32>;
var<private> nodeVar90 : vec3<f32>;
var<private> directSpecular : vec3<f32>;
var<private> nodeVar91 : vec3<f32>;
var<private> nodeVar92 : f32;
var<private> nodeVar93 : f32;
var<private> nodeVar94 : f32;
var<private> nodeVar95 : vec3<f32>;
var<private> nodeVar96 : vec3<f32>;
var<private> nodeVar97 : vec3<f32>;
var<private> nodeVar98 : vec3<f32>;
var<private> nodeVar99 : vec3<f32>;
var<private> nodeVar100 : vec4<f32>;
var<private> nodeVar101 : vec4<f32>;
var<private> nodeVar102 : vec3<f32>;
var<private> nodeVar103 : vec3<f32>;
var<private> nodeVar104 : f32;
var<private> shadowPositionWorld : vec3<f32>;
var<private> nodeVar105 : f32;
var<private> nodeVar106 : vec4<f32>;
var<private> nodeVar107 : vec3<f32>;
var<private> nodeVar108 : vec3<f32>;
var<private> nodeVar109 : f32;
var<private> nodeVar110 : f32;
var<private> nodeVar111 : vec2<f32>;
var<private> nodeVar112 : f32;
var<private> nodeVar113 : vec2<f32>;
var<private> nodeVar114 : f32;
var<private> nodeVar115 : vec2<f32>;
var<private> nodeVar116 : f32;
var<private> nodeVar117 : vec2<f32>;
var<private> nodeVar118 : f32;
var<private> nodeVar119 : vec2<f32>;
var<private> nodeVar120 : f32;
var<private> nodeVar121 : f32;
var<private> nodeVar122 : vec3<f32>;
var<private> nodeVar123 : vec3<f32>;
var<private> nodeVar124 : vec3<f32>;
var<private> nodeVar125 : vec3<f32>;
var<private> nodeVar126 : vec3<f32>;
var<private> nodeVar127 : vec3<f32>;
var<private> nodeVar128 : f32;
var<private> nodeVar129 : f32;
var<private> nodeVar130 : f32;
var<private> nodeVar131 : vec3<f32>;
var<private> nodeVar132 : vec3<f32>;
var<private> nodeVar133 : vec3<f32>;
var<private> nodeVar134 : vec3<f32>;
var<private> nodeVar135 : vec3<f32>;
var<private> nodeVar136 : vec3<f32>;
var<private> nodeVar137 : f32;
var<private> nodeVar138 : f32;
var<private> nodeVar139 : f32;
var<private> nodeVar140 : vec3<f32>;
var<private> nodeVar141 : vec3<f32>;
var<private> nodeVar142 : vec3<f32>;
var<private> nodeVar143 : vec3<f32>;
var<private> nodeVar144 : vec3<f32>;
var<private> nodeVar145 : vec3<f32>;
var<private> nodeVar146 : f32;
var<private> nodeVar147 : f32;
var<private> nodeVar148 : f32;
var<private> nodeVar149 : f32;
var<private> nodeVar150 : f32;
var<private> nodeVar151 : vec3<f32>;
var<private> nodeVar152 : vec3<f32>;
var<private> nodeVar153 : vec3<f32>;
var<private> nodeVar154 : vec3<f32>;
var<private> nodeVar155 : vec3<f32>;
var<private> nodeVar156 : vec3<f32>;
var<private> nodeVar157 : vec3<f32>;
var<private> nodeVar158 : f32;
var<private> nodeVar159 : f32;
var<private> nodeVar160 : f32;
var<private> nodeVar161 : vec3<f32>;
var<private> nodeVar162 : vec3<f32>;
var<private> nodeVar163 : vec3<f32>;
var<private> nodeVar164 : vec3<f32>;
var<private> nodeVar165 : vec3<f32>;
var<private> nodeVar166 : vec3<f32>;
var<private> nodeVar167 : f32;
var<private> nodeVar168 : f32;
var<private> nodeVar169 : f32;
var<private> nodeVar170 : vec3<f32>;
var<private> nodeVar171 : vec3<f32>;
var<private> nodeVar172 : vec3<f32>;
var<private> nodeVar173 : vec3<f32>;
var<private> nodeVar174 : vec3<f32>;
var<private> nodeVar175 : vec3<f32>;
var<private> nodeVar176 : vec3<f32>;
var<private> nodeVar177 : f32;
var<private> nodeVar178 : vec3<f32>;
var<private> nodeVar179 : vec3<f32>;
var<private> nodeVar180 : vec3<f32>;
var<private> nodeVar181 : vec3<f32>;
var<private> nodeVar182 : vec3<f32>;
var<private> nodeVar183 : vec3<f32>;
var<private> nodeVar184 : vec3<f32>;
var<private> nodeVar185 : f32;
var<private> nodeVar186 : f32;
var<private> nodeVar187 : f32;
var<private> nodeVar188 : vec3<f32>;
var<private> nodeVar189 : vec3<f32>;
var<private> nodeVar190 : vec3<f32>;
var<private> nodeVar191 : vec3<f32>;
var<private> nodeVar192 : vec3<f32>;
var<private> nodeVar193 : vec3<f32>;
var<private> nodeVar194 : vec3<f32>;
var<private> nodeVar195 : vec3<f32>;
var<private> nodeVar196 : vec3<f32>;
var<private> nodeVar197 : vec3<f32>;
var<private> nodeVar198 : vec3<f32>;
var<private> nodeVar199 : vec3<f32>;
var<private> nodeVar200 : vec3<f32>;
var<private> indirectDiffuse : vec3<f32>;
var<private> nodeVar201 : vec3<f32>;
var<private> singleScatteringDielectric : vec3<f32>;
var<private> multiScatteringDielectric : vec3<f32>;
var<private> singleScatteringMetallic : vec3<f32>;
var<private> multiScatteringMetallic : vec3<f32>;
var<private> nodeVar202 : vec3<f32>;
var<private> nodeVar203 : f32;
var<private> nodeVar204 : vec3<f32>;
var<private> nodeVar205 : vec3<f32>;
var<private> nodeVar206 : vec3<f32>;
var<private> nodeVar207 : vec3<f32>;
var<private> nodeVar208 : vec3<f32>;
var<private> nodeVar209 : vec3<f32>;
var<private> nodeVar210 : vec3<f32>;
var<private> nodeVar211 : f32;
var<private> nodeVar212 : f32;
var<private> nodeVar213 : f32;
var<private> nodeVar214 : vec3<f32>;
var<private> nodeVar215 : vec3<f32>;
var<private> nodeVar216 : vec3<f32>;
var<private> nodeVar217 : vec3<f32>;
var<private> nodeVar218 : vec3<f32>;
var<private> nodeVar219 : vec3<f32>;
var<private> nodeVar220 : vec3<f32>;
var<private> nodeVar221 : f32;
var<private> nodeVar222 : vec3<f32>;
var<private> nodeVar223 : vec3<f32>;
var<private> nodeVar224 : vec3<f32>;
var<private> nodeVar225 : vec3<f32>;
var<private> nodeVar226 : vec3<f32>;
var<private> nodeVar227 : vec3<f32>;
var<private> nodeVar228 : vec3<f32>;
var<private> nodeVar229 : f32;
var<private> nodeVar230 : f32;
var<private> nodeVar231 : f32;
var<private> nodeVar232 : vec3<f32>;
var<private> nodeVar233 : vec3<f32>;
var<private> nodeVar234 : vec3<f32>;
var<private> nodeVar235 : vec3<f32>;
var<private> nodeVar236 : vec3<f32>;
var<private> nodeVar237 : vec3<f32>;
var<private> radiance : vec3<f32>;
var<private> nodeVar238 : vec3<f32>;
var<private> nodeVar239 : vec3<f32>;
var<private> nodeVar240 : vec3<f32>;
var<private> iblIrradiance : vec3<f32>;
var<private> nodeVar241 : vec3<f32>;
var<private> nodeVar242 : vec3<f32>;
var<private> nodeVar243 : vec3<f32>;
var<private> nodeVar244 : vec3<f32>;
var<private> nodeVar245 : vec3<f32>;
var<private> nodeVar246 : vec3<f32>;
var<private> nodeVar247 : vec3<f32>;
var<private> nodeVar248 : vec3<f32>;
var<private> nodeVar249 : vec3<f32>;
var<private> nodeVar250 : vec3<f32>;
var<private> indirectSpecular : vec3<f32>;
var<private> nodeVar251 : vec3<f32>;
var<private> nodeVar252 : vec3<f32>;
var<private> ambientOcclusion : f32;
var<private> nodeVar253 : vec3<f32>;
var<private> nodeVar254 : f32;
var<private> nodeVar255 : f32;
var<private> nodeVar256 : f32;
var<private> nodeVar257 : f32;
var<private> nodeVar258 : f32;
var<private> nodeVar259 : f32;
var<private> nodeVar260 : f32;
var<private> nodeVar261 : f32;
var<private> nodeVar262 : f32;
var<private> nodeVar263 : f32;
var<private> nodeVar264 : f32;
var<private> nodeVar265 : vec3<f32>;
var<private> totalDiffuse : vec3<f32>;
var<private> nodeVar266 : vec3<f32>;
var<private> totalSpecular : vec3<f32>;
var<private> nodeVar267 : vec3<f32>;
var<private> outgoingLight : vec3<f32>;
var<private> nodeVar268 : vec3<f32>;
var<private> nodeVar269 : f32;
var<private> nodeVar270 : vec4<f32>;

// codes
fn tsl_mod_float( x : f32, y : f32 ) -> f32 { return x - y * floor( x / y ); }
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
	@location( 1 ) v_normalViewGeometry : vec3<f32>,
	@location( 2 ) v_positionWorld : vec3<f32>,
	@location( 3 ) v_positionViewDirection : vec3<f32>,
	@location( 4 ) nodeVarying7 : vec3<f32>,
	@location( 5 ) nodeVarying8 : vec2<f32>,
	@location( 6 ) nodeVarying9 : vec2<f32>,
	@location( 7 ) nodeVarying10 : vec3<f32>,
	@builtin( position ) fragCoord : vec4<f32> ) -> OutputStruct {

	// flow
	// code

	nodeVar0 = floor( ( nodeVarying8.y / 0.72 ) );
	nodeVar1 = ( ( u32( ( nodeVar0 + 2.3 ) ) * 747796405u ) + 2891336453u );
	nodeVar2 = ( ( ( nodeVar1 >> ( ( nodeVar1 >> 28u ) + 4u ) ) ^ nodeVar1 ) * 277803737u );
	nodeVar3 = ( ( ( f32( ( ( nodeVar2 >> 22u ) ^ nodeVar2 ) ) * 2.3283064365386963e-10 ) * 0.2 ) + 0.28 );
	nodeVar4 = ( nodeVarying8.y - ( nodeVar0 * 0.72 ) );
	nodeVar5 = step( nodeVar3, nodeVar4 );
	nodeVar6 = ( ( nodeVar0 * 2.0 ) + nodeVar5 );
	nodeVar7 = ( ( u32( ( nodeVar6 + 11.3 ) ) * 747796405u ) + 2891336453u );
	nodeVar8 = ( ( ( nodeVar7 >> ( ( nodeVar7 >> 28u ) + 4u ) ) ^ nodeVar7 ) * 277803737u );
	nodeVar9 = step( 0.5, nodeVarying9.y );
	nodeVar10 = mix( ( ( ( f32( ( ( nodeVar8 >> 22u ) ^ nodeVar8 ) ) * 2.3283064365386963e-10 ) * 0.75 ) + 0.62 ), nodeVarying9.x, nodeVar9 );
	nodeVar11 = ( ( u32( ( nodeVar6 + 5.1 ) ) * 747796405u ) + 2891336453u );
	nodeVar12 = ( ( ( nodeVar11 >> ( ( nodeVar11 >> 28u ) + 4u ) ) ^ nodeVar11 ) * 277803737u );
	nodeVar13 = ( ( nodeVarying8.x / nodeVar10 ) + ( ( tsl_mod_float( nodeVar6, 2.0 ) * 0.5 ) + floor( ( ( f32( ( ( nodeVar12 >> 22u ) ^ nodeVar12 ) ) * 2.3283064365386963e-10 ) * 8.0 ) ) ) );
	nodeVar14 = floor( nodeVar13 );
	nodeVar15 = ( mix( nodeVar14, tsl_mod_float( nodeVar14, max( nodeVarying9.y, 1.0 ) ), nodeVar9 ) + ( nodeVar6 * 57.3 ) );
	nodeVar16 = ( ( u32( ( nodeVar15 + 19.1 ) ) * 747796405u ) + 2891336453u );
	nodeVar17 = ( ( ( nodeVar16 >> ( ( nodeVar16 >> 28u ) + 4u ) ) ^ nodeVar16 ) * 277803737u );
	nodeVar18 = ( ( f32( ( ( nodeVar17 >> 22u ) ^ nodeVar17 ) ) * 2.3283064365386963e-10 ) - 0.5 );
	nodeVar19 = ( ( u32( nodeVar15 ) * 747796405u ) + 2891336453u );
	nodeVar20 = ( ( ( nodeVar19 >> ( ( nodeVar19 >> 28u ) + 4u ) ) ^ nodeVar19 ) * 277803737u );
	nodeVar21 = ( ( ( f32( ( ( nodeVar20 >> 22u ) ^ nodeVar20 ) ) * 2.3283064365386963e-10 ) * 0.62 ) + 0.66 );
	nodeVar22 = textureSample( nodeUniform0, nodeUniform0_sampler, ( vec3<f32>( ( nodeVarying8.x * 6.3 ), ( nodeVarying8.y * 6.3 ), ( nodeVar15 * 0.37 ) ) / vec3<f32>( 8.0 ) ) ).x;
	nodeVar23 = smoothstep( 0.4, 0.7, 0.0 );
	nodeVar24 = textureSample( nodeUniform0, nodeUniform0_sampler, ( vec3<f32>( ( nodeVarying8.x * 0.85 ), ( nodeVarying8.y * 0.16 ), 3.3 ) / vec3<f32>( 8.0 ) ) ).x;
	nodeVar25 = textureSample( nodeUniform0, nodeUniform0_sampler, ( vec3<f32>( ( nodeVarying8.x * 0.5 ), ( nodeVarying8.y * 0.45 ), 8.2 ) / vec3<f32>( 8.0 ) ) ).x;
	nodeVar26 = fract( nodeVar13 );
	nodeVar27 = mix( nodeVar3, ( 0.72 - nodeVar3 ), nodeVar5 );
	nodeVar28 = ( ( nodeVar4 - ( nodeVar5 * nodeVar3 ) ) / nodeVar27 );
	nodeVar29 = textureSample( nodeUniform0, nodeUniform0_sampler, ( vec3<f32>( ( nodeVarying8.x * 7.1 ), ( nodeVarying8.y * 7.1 ), 1.7 ) / vec3<f32>( 8.0 ) ) ).x;
	nodeVar30 = ( min( ( min( nodeVar26, ( 1.0 - nodeVar26 ) ) * nodeVar10 ), ( min( nodeVar28, ( 1.0 - nodeVar28 ) ) * nodeVar27 ) ) + ( nodeVar29 * 0.011 ) );
	nodeVar31 = max( fwidth( nodeVarying8.x ), fwidth( nodeVarying8.y ) );
	nodeVar32 = ( ( nodeVar31 * 0.75 ) + 0.0015 );
	nodeVar33 = mix( ( 1.0 - smoothstep( ( 0.024 - nodeVar32 ), ( 0.024 + nodeVar32 ), nodeVar30 ) ), 0.17, smoothstep( 0.1, 0.34, nodeVar31 ) );
	nodeVar34 = smoothstep( 1.7, 0.0, ( ( nodeVarying10.z + ( nodeVar22 * 0.35 ) ) + ( nodeVar25 * 0.4 ) ) );
	nodeVar35 = textureSample( nodeUniform0, nodeUniform0_sampler, ( vec3<f32>( ( nodeVarying8.x * 2.4 ), ( nodeVarying8.y * 2.4 ), 9.1 ) / vec3<f32>( 8.0 ) ) ).x;
	nodeVar36 = mix( ( ( nodeVarying7 * vec3<f32>( ( 1.0 + ( nodeVar18 * 0.12 ) ), ( 1.0 - ( nodeVar18 * 0.02 ) ), ( 1.0 - ( nodeVar18 * 0.14 ) ) ) ) * vec3<f32>( max( ( ( ( ( ( ( ( ( ( ( nodeVar21 + ( nodeVar22 * 0.11 ) ) + 0.0 ) + ( nodeVar23 * 0.07 ) ) + ( nodeVar24 * 0.1 ) ) + ( nodeVar25 * 0.12 ) ) + ( smoothstep( 0.32, 0.0, ( min( nodeVarying10.x, nodeVarying10.y ) + ( nodeVar22 * 0.08 ) ) ) * 0.16 ) ) + ( ( smoothstep( 0.08, 0.035, nodeVar30 ) * ( 1.0 - nodeVar33 ) ) * 0.1 ) ) * ( ( smoothstep( 0.0, 0.2, nodeVar30 ) * 0.16 ) + 0.84 ) ) * ( 1.0 - ( nodeVar34 * 0.4 ) ) ) * ( 1.0 - ( nodeVar33 * 0.65 ) ) ), 0.0 ) ) ), ( vec3<f32>( 0.07, 0.09, 0.03 ) * vec3<f32>( nodeVar21 ) ), ( ( ( ( nodeVar34 * smoothstep( 0.0, 0.55, ( nodeVar35 + 0.15 ) ) ) * smoothstep( 1.1, 0.0, nodeVarying10.z ) ) * ( 1.0 - nodeVar33 ) ) * 0.6 ) );
	DiffuseColor = vec4<f32>( nodeVar36, 1.0 );
	DiffuseColor.w = ( DiffuseColor.w * object.nodeUniform1 );
	DiffuseColor.w = 1.0;
	Metalness = object.nodeUniform2;
	normalViewGeometry = normalize( v_normalViewGeometry );
	nodeVar37 = max( abs( dpdx( normalViewGeometry ) ), abs( - dpdy( normalViewGeometry ) ) );
	Roughness = min( ( max( mix( 0.93, 0.5, ( nodeVar34 * 0.75 ) ), 0.0525 ) + max( max( nodeVar37.x, nodeVar37.y ), nodeVar37.z ) ), 1.0 );
	SpecularColor = vec3<f32>( 0.04, 0.04, 0.04 );
	SpecularColorBlended = mix( vec3<f32>( 0.04, 0.04, 0.04 ), DiffuseColor.xyz, Metalness );
	SpecularF90 = 1.0;
	DiffuseContribution = ( DiffuseColor.xyz * vec3<f32>( ( 1.0 - object.nodeUniform2 ) ) );
	nodeVar38 = ( NodeBuffer_8578.value[ 0u ].xyz - v_positionWorld );
	nodeVar39 = dot( nodeVar38, nodeVar38 );
	nodeVar40 = dpdx( v_positionView );
	nodeVar41 = - dpdy( v_positionView );
	NORMAL_normalView = normalViewGeometry;
	NORMAL_nodeVar42 = cross( nodeVar41, NORMAL_normalView );
	NORMAL_nodeVar43 = dot( nodeVar40, NORMAL_nodeVar42 );
	nodeVar44 = ( ( ( ( ( smoothstep( 0.0, 0.07, nodeVar30 ) * 0.014 ) + ( smoothstep( 0.0, 0.02, nodeVar30 ) * 0.006 ) ) + 0.0 ) + ( nodeVar23 * -0.004 ) ) * ( 1.0 - smoothstep( 0.05, 0.22, nodeVar31 ) ) );
	nodeVar45 = ( vec3<f32>( sign( NORMAL_nodeVar43 ) ) * ( ( vec3<f32>( dpdx( nodeVar44 ) ) * NORMAL_nodeVar42 ) + ( vec3<f32>( - dpdy( nodeVar44 ) ) * cross( NORMAL_normalView, nodeVar40 ) ) ) );
	normalView = normalize( ( ( vec3<f32>( abs( NORMAL_nodeVar43 ) ) * NORMAL_normalView ) - nodeVar45 ) );
	normalWorld = normalize( ( vec4<f32>( normalView, 0.0 ) * render.cameraViewMatrix ).xyz );
	nodeVar46 = ( NodeBuffer_8578.value[ 1u ].xyz - v_positionWorld );
	nodeVar47 = dot( nodeVar46, nodeVar46 );
	nodeVar48 = ( NodeBuffer_8578.value[ 2u ].xyz - v_positionWorld );
	nodeVar49 = dot( nodeVar48, nodeVar48 );
	nodeVar50 = ( NodeBuffer_8578.value[ 3u ].xyz - v_positionWorld );
	nodeVar51 = dot( nodeVar50, nodeVar50 );
	nodeVar52 = ( NodeBuffer_8578.value[ 4u ].xyz - v_positionWorld );
	nodeVar53 = dot( nodeVar52, nodeVar52 );
	nodeVar54 = ( NodeBuffer_8578.value[ 5u ].xyz - v_positionWorld );
	nodeVar55 = dot( nodeVar54, nodeVar54 );
	nodeVar56 = ( NodeBuffer_8578.value[ 6u ].xyz - v_positionWorld );
	nodeVar57 = dot( nodeVar56, nodeVar56 );
	EmissiveColor = ( nodeVar36 * ( ( ( ( ( ( ( vec3<f32>( 0.0, 0.0, 0.0 ) + ( vec3<f32>( 1.0, 0.5, 0.17 ) * vec3<f32>( ( ( ( ( NodeBuffer_8578.value[ 0u ].w * ( 1.0 / ( 1.0 + ( nodeVar39 * 0.55 ) ) ) ) * ( ( clamp( dot( normalWorld, normalize( nodeVar38 ) ), 0.0, 1.0 ) * 0.8 ) + 0.2 ) ) * smoothstep( 1.0, 0.12, ( nodeVar39 / 64.0 ) ) ) * ( ( 0.88 + ( sin( ( ( render.nodeUniform8 * 11.0 ) + 0.0 ) ) * 0.07 ) ) + ( sin( ( ( render.nodeUniform8 * 5.3 ) + ( 0.0 * 1.9 ) ) ) * 0.05 ) ) ) ) ) ) + ( vec3<f32>( 1.0, 0.5, 0.17 ) * vec3<f32>( ( ( ( ( NodeBuffer_8578.value[ 1u ].w * ( 1.0 / ( 1.0 + ( nodeVar47 * 0.55 ) ) ) ) * ( ( clamp( dot( normalWorld, normalize( nodeVar46 ) ), 0.0, 1.0 ) * 0.8 ) + 0.2 ) ) * smoothstep( 1.0, 0.12, ( nodeVar47 / 64.0 ) ) ) * ( ( 0.88 + ( sin( ( ( render.nodeUniform8 * 11.0 ) + 2.13 ) ) * 0.07 ) ) + ( sin( ( ( render.nodeUniform8 * 5.3 ) + ( 2.13 * 1.9 ) ) ) * 0.05 ) ) ) ) ) ) + ( vec3<f32>( 1.0, 0.5, 0.17 ) * vec3<f32>( ( ( ( ( NodeBuffer_8578.value[ 2u ].w * ( 1.0 / ( 1.0 + ( nodeVar49 * 0.55 ) ) ) ) * ( ( clamp( dot( normalWorld, normalize( nodeVar48 ) ), 0.0, 1.0 ) * 0.8 ) + 0.2 ) ) * smoothstep( 1.0, 0.12, ( nodeVar49 / 64.0 ) ) ) * ( ( 0.88 + ( sin( ( ( render.nodeUniform8 * 11.0 ) + 4.26 ) ) * 0.07 ) ) + ( sin( ( ( render.nodeUniform8 * 5.3 ) + ( 4.26 * 1.9 ) ) ) * 0.05 ) ) ) ) ) ) + ( vec3<f32>( 1.0, 0.5, 0.17 ) * vec3<f32>( ( ( ( ( NodeBuffer_8578.value[ 3u ].w * ( 1.0 / ( 1.0 + ( nodeVar51 * 0.55 ) ) ) ) * ( ( clamp( dot( normalWorld, normalize( nodeVar50 ) ), 0.0, 1.0 ) * 0.8 ) + 0.2 ) ) * smoothstep( 1.0, 0.12, ( nodeVar51 / 64.0 ) ) ) * ( ( 0.88 + ( sin( ( ( render.nodeUniform8 * 11.0 ) + 6.39 ) ) * 0.07 ) ) + ( sin( ( ( render.nodeUniform8 * 5.3 ) + ( 6.39 * 1.9 ) ) ) * 0.05 ) ) ) ) ) ) + ( vec3<f32>( 1.0, 0.5, 0.17 ) * vec3<f32>( ( ( ( ( NodeBuffer_8578.value[ 4u ].w * ( 1.0 / ( 1.0 + ( nodeVar53 * 0.55 ) ) ) ) * ( ( clamp( dot( normalWorld, normalize( nodeVar52 ) ), 0.0, 1.0 ) * 0.8 ) + 0.2 ) ) * smoothstep( 1.0, 0.12, ( nodeVar53 / 64.0 ) ) ) * ( ( 0.88 + ( sin( ( ( render.nodeUniform8 * 11.0 ) + 8.52 ) ) * 0.07 ) ) + ( sin( ( ( render.nodeUniform8 * 5.3 ) + ( 8.52 * 1.9 ) ) ) * 0.05 ) ) ) ) ) ) + ( vec3<f32>( 1.0, 0.5, 0.17 ) * vec3<f32>( ( ( ( ( NodeBuffer_8578.value[ 5u ].w * ( 1.0 / ( 1.0 + ( nodeVar55 * 0.55 ) ) ) ) * ( ( clamp( dot( normalWorld, normalize( nodeVar54 ) ), 0.0, 1.0 ) * 0.8 ) + 0.2 ) ) * smoothstep( 1.0, 0.12, ( nodeVar55 / 64.0 ) ) ) * ( ( 0.88 + ( sin( ( ( render.nodeUniform8 * 11.0 ) + 10.649999999999999 ) ) * 0.07 ) ) + ( sin( ( ( render.nodeUniform8 * 5.3 ) + ( 10.649999999999999 * 1.9 ) ) ) * 0.05 ) ) ) ) ) ) + ( vec3<f32>( 1.0, 0.5, 0.17 ) * vec3<f32>( ( ( ( ( NodeBuffer_8578.value[ 6u ].w * ( 1.0 / ( 1.0 + ( nodeVar57 * 0.55 ) ) ) ) * ( ( clamp( dot( normalWorld, normalize( nodeVar56 ) ), 0.0, 1.0 ) * 0.8 ) + 0.2 ) ) * smoothstep( 1.0, 0.12, ( nodeVar57 / 64.0 ) ) ) * ( ( 0.88 + ( sin( ( ( render.nodeUniform8 * 11.0 ) + 12.78 ) ) * 0.07 ) ) + ( sin( ( ( render.nodeUniform8 * 5.3 ) + ( 12.78 * 1.9 ) ) ) * 0.05 ) ) ) ) ) ) );
	positionViewDirection = normalize( v_positionViewDirection );
	nodeVar58 = dot( normalView, positionViewDirection );
	nodeVar59 = textureSample( nodeUniform9, nodeUniform9_sampler, vec2<f32>( Roughness, clamp( nodeVar58, 0.0, 1.0 ) ) ).xy;
	let dfg = nodeVar59;
	nodeVar60 = ( dfg.x + dfg.y );
	nodeVar61 = ( 1.0 / nodeVar60 );
	nodeVar62 = nodeVar61;
	nodeVar63 = ( nodeVar62 - 1.0 );
	nodeVar64 = ( SpecularColorBlended * vec3<f32>( nodeVar63 ) );
	nodeVar65 = ( nodeVar64 + vec3<f32>( 1.0 ) );
	let multiScatteringCompensation = nodeVar65;
	irradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar66 = dot( normalWorld, normalize( render.nodeUniform12 ) );
	nodeVar67 = ( nodeVar66 * 0.5 );
	nodeVar68 = ( nodeVar67 + 0.5 );
	nodeVar69 = mix( render.nodeUniform10, render.nodeUniform11, nodeVar68 );
	nodeVar70 = ( irradiance + nodeVar69 );
	irradiance = nodeVar70;
	nodeVar71 = ( render.nodeUniform13 - render.nodeUniform14 );
	nodeVar72 = vec4<f32>( nodeVar71, 0.0 );
	nodeVar73 = ( render.cameraViewMatrix * nodeVar72 );
	nodeVar74 = normalize( nodeVar73.xyz );
	nodeVar75 = nodeVar74;
	nodeVar76 = dot( normalView, nodeVar75 );
	nodeVar77 = ( vec3<f32>( clamp( nodeVar76, 0.0, 1.0 ) ) * render.nodeUniform15 );
	nodeVar78 = nodeVar77;
	directDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar79 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar80 = ( nodeVar78 * nodeVar79 );
	nodeVar81 = ( nodeVar75 + positionViewDirection );
	nodeVar82 = normalize( nodeVar81 );
	nodeVar83 = dot( positionViewDirection, nodeVar82 );
	nodeVar84 = clamp( nodeVar83, 0.0, 1.0 );
	nodeVar85 = exp2( ( ( ( nodeVar84 * -5.55473 ) - 6.98316 ) * nodeVar84 ) );
	nodeVar86 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar85 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar85 ) ) );
	nodeVar87 = ( vec3<f32>( 1.0 ) - nodeVar86 );
	nodeVar88 = nodeVar87;
	nodeVar89 = ( nodeVar80 * nodeVar88 );
	nodeVar90 = ( directDiffuse + nodeVar89 );
	directDiffuse = nodeVar90;
	directSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar91 = normalize( ( nodeVar75 + positionViewDirection ) );
	nodeVar92 = clamp( dot( positionViewDirection, nodeVar91 ), 0.0, 1.0 );
	nodeVar93 = exp2( ( ( ( nodeVar92 * -5.55473 ) - 6.98316 ) * nodeVar92 ) );
	nodeVar94 = ( Roughness * Roughness );
	nodeVar95 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar93 ) ) ) + vec3<f32>( ( 1.0 * nodeVar93 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar94, clamp( dot( normalView, nodeVar75 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar94, clamp( dot( normalView, nodeVar91 ), 0.0, 1.0 ) ) ) );
	nodeVar96 = ( nodeVar78 * nodeVar95 );
	nodeVar97 = ( nodeVar96 * multiScatteringCompensation );
	nodeVar98 = ( directSpecular + nodeVar97 );
	directSpecular = nodeVar98;
	nodeVar99 = ( render.nodeUniform16 - render.nodeUniform17 );
	nodeVar100 = vec4<f32>( nodeVar99, 0.0 );
	nodeVar101 = ( render.cameraViewMatrix * nodeVar100 );
	nodeVar102 = normalize( nodeVar101.xyz );
	nodeVar103 = nodeVar102;
	nodeVar104 = dot( normalView, nodeVar103 );
	shadowPositionWorld = v_positionWorld;
	nodeVar106 = ( render.nodeUniform19 * vec4<f32>( ( shadowPositionWorld + ( normalWorld * vec3<f32>( render.nodeUniform20 ) ) ), 1.0 ) );
	nodeVar107 = ( nodeVar106.xyz / vec3<f32>( nodeVar106.w ) );
	nodeVar108 = vec3<f32>( nodeVar107.x, ( 1.0 - nodeVar107.y ), ( nodeVar107.z + render.nodeUniform21 ) );

	if ( ( ( ( ( ( nodeVar108.x >= 0.0 ) && ( nodeVar108.x <= 1.0 ) ) && ( nodeVar108.y >= 0.0 ) ) && ( nodeVar108.y <= 1.0 ) ) && ( nodeVar108.z <= 1.0 ) ) ) {

		nodeVar109 = ( interleavedGradientNoise( fragCoord.xy ) * 6.28318530718 );
		nodeVar110 = ( render.nodeUniform23 * ( vec2<f32>( 1.0, 1.0 ) / render.nodeUniform24 ).x );
		nodeVar111 = ( nodeVar108.xy + ( vogelDiskSample( 0, 5, nodeVar109 ) * vec2<f32>( nodeVar110 ) ) );
		nodeVar112 = textureSampleCompare( nodeUniform22, nodeUniform22_sampler, nodeVar111, nodeVar108.z );
		nodeVar113 = ( nodeVar108.xy + ( vogelDiskSample( 1, 5, nodeVar109 ) * vec2<f32>( nodeVar110 ) ) );
		nodeVar114 = textureSampleCompare( nodeUniform22, nodeUniform22_sampler, nodeVar113, nodeVar108.z );
		nodeVar115 = ( nodeVar108.xy + ( vogelDiskSample( 2, 5, nodeVar109 ) * vec2<f32>( nodeVar110 ) ) );
		nodeVar116 = textureSampleCompare( nodeUniform22, nodeUniform22_sampler, nodeVar115, nodeVar108.z );
		nodeVar117 = ( nodeVar108.xy + ( vogelDiskSample( 3, 5, nodeVar109 ) * vec2<f32>( nodeVar110 ) ) );
		nodeVar118 = textureSampleCompare( nodeUniform22, nodeUniform22_sampler, nodeVar117, nodeVar108.z );
		nodeVar119 = ( nodeVar108.xy + ( vogelDiskSample( 4, 5, nodeVar109 ) * vec2<f32>( nodeVar110 ) ) );
		nodeVar120 = textureSampleCompare( nodeUniform22, nodeUniform22_sampler, nodeVar119, nodeVar108.z );
		nodeVar105 = ( ( ( ( ( nodeVar112 + nodeVar114 ) + nodeVar116 ) + nodeVar118 ) + nodeVar120 ) * 0.2 );

	} else {

		nodeVar105 = 1.0;

	}

	nodeVar121 = mix( 1.0, nodeVar105, render.nodeUniform25 );
	nodeVar122 = ( vec3<f32>( clamp( nodeVar104, 0.0, 1.0 ) ) * ( render.nodeUniform18 * vec3<f32>( nodeVar121 ) ) );
	nodeVar123 = nodeVar122;
	nodeVar124 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar125 = ( nodeVar123 * nodeVar124 );
	nodeVar126 = ( nodeVar103 + positionViewDirection );
	nodeVar127 = normalize( nodeVar126 );
	nodeVar128 = dot( positionViewDirection, nodeVar127 );
	nodeVar129 = clamp( nodeVar128, 0.0, 1.0 );
	nodeVar130 = exp2( ( ( ( nodeVar129 * -5.55473 ) - 6.98316 ) * nodeVar129 ) );
	nodeVar131 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar130 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar130 ) ) );
	nodeVar132 = ( vec3<f32>( 1.0 ) - nodeVar131 );
	nodeVar133 = nodeVar132;
	nodeVar134 = ( nodeVar125 * nodeVar133 );
	nodeVar135 = ( directDiffuse + nodeVar134 );
	directDiffuse = nodeVar135;
	nodeVar136 = normalize( ( nodeVar103 + positionViewDirection ) );
	nodeVar137 = clamp( dot( positionViewDirection, nodeVar136 ), 0.0, 1.0 );
	nodeVar138 = exp2( ( ( ( nodeVar137 * -5.55473 ) - 6.98316 ) * nodeVar137 ) );
	nodeVar139 = ( Roughness * Roughness );
	nodeVar140 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar138 ) ) ) + vec3<f32>( ( 1.0 * nodeVar138 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar139, clamp( dot( normalView, nodeVar103 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar139, clamp( dot( normalView, nodeVar136 ), 0.0, 1.0 ) ) ) );
	nodeVar141 = ( nodeVar123 * nodeVar140 );
	nodeVar142 = ( nodeVar141 * multiScatteringCompensation );
	nodeVar143 = ( directSpecular + nodeVar142 );
	directSpecular = nodeVar143;
	nodeVar144 = ( render.nodeUniform26 - v_positionView );
	nodeVar145 = normalize( nodeVar144 );
	nodeVar146 = dot( normalView, nodeVar145 );

	if ( ( render.nodeUniform28 > 0.0 ) ) {

		nodeVar148 = length( nodeVar144 );
		nodeVar149 = ( nodeVar148 / render.nodeUniform28 );
		nodeVar150 = clamp( ( 1.0 - ( ( ( nodeVar149 * nodeVar149 ) * nodeVar149 ) * nodeVar149 ) ), 0.0, 1.0 );
		nodeVar147 = ( ( 1.0 / max( pow( nodeVar148, render.nodeUniform29 ), 0.01 ) ) * ( nodeVar150 * nodeVar150 ) );

	} else {

		nodeVar147 = ( 1.0 / max( pow( length( nodeVar144 ), render.nodeUniform29 ), 0.01 ) );

	}

	nodeVar151 = ( render.nodeUniform27 * vec3<f32>( nodeVar147 ) );
	nodeVar152 = ( vec3<f32>( clamp( nodeVar146, 0.0, 1.0 ) ) * nodeVar151 );
	nodeVar153 = nodeVar152;
	nodeVar154 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar155 = ( nodeVar153 * nodeVar154 );
	nodeVar156 = ( nodeVar145 + positionViewDirection );
	nodeVar157 = normalize( nodeVar156 );
	nodeVar158 = dot( positionViewDirection, nodeVar157 );
	nodeVar159 = clamp( nodeVar158, 0.0, 1.0 );
	nodeVar160 = exp2( ( ( ( nodeVar159 * -5.55473 ) - 6.98316 ) * nodeVar159 ) );
	nodeVar161 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar160 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar160 ) ) );
	nodeVar162 = ( vec3<f32>( 1.0 ) - nodeVar161 );
	nodeVar163 = nodeVar162;
	nodeVar164 = ( nodeVar155 * nodeVar163 );
	nodeVar165 = ( directDiffuse + nodeVar164 );
	directDiffuse = nodeVar165;
	nodeVar166 = normalize( ( nodeVar145 + positionViewDirection ) );
	nodeVar167 = clamp( dot( positionViewDirection, nodeVar166 ), 0.0, 1.0 );
	nodeVar168 = exp2( ( ( ( nodeVar167 * -5.55473 ) - 6.98316 ) * nodeVar167 ) );
	nodeVar169 = ( Roughness * Roughness );
	nodeVar170 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar168 ) ) ) + vec3<f32>( ( 1.0 * nodeVar168 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar169, clamp( dot( normalView, nodeVar145 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar169, clamp( dot( normalView, nodeVar166 ), 0.0, 1.0 ) ) ) );
	nodeVar171 = ( nodeVar153 * nodeVar170 );
	nodeVar172 = ( nodeVar171 * multiScatteringCompensation );
	nodeVar173 = ( directSpecular + nodeVar172 );
	directSpecular = nodeVar173;
	nodeVar174 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar175 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar176 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar177 = ( SpecularF90 * dfg.y );
	nodeVar178 = ( nodeVar176 + vec3<f32>( nodeVar177 ) );
	nodeVar179 = ( nodeVar174 + nodeVar178 );
	nodeVar174 = nodeVar179;
	nodeVar180 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar181 = nodeVar180;
	nodeVar182 = ( nodeVar181 * vec3<f32>( 0.047619 ) );
	nodeVar183 = ( SpecularColor + nodeVar182 );
	nodeVar184 = ( nodeVar178 * nodeVar183 );
	nodeVar185 = ( dfg.x + dfg.y );
	nodeVar186 = ( 1.0 - nodeVar185 );
	nodeVar187 = nodeVar186;
	nodeVar188 = ( vec3<f32>( nodeVar187 ) * nodeVar183 );
	nodeVar189 = ( vec3<f32>( 1.0 ) - nodeVar188 );
	nodeVar190 = nodeVar189;
	nodeVar191 = ( nodeVar184 / nodeVar190 );
	nodeVar192 = ( nodeVar191 * vec3<f32>( nodeVar187 ) );
	nodeVar193 = ( nodeVar175 + nodeVar192 );
	nodeVar175 = nodeVar193;
	nodeVar194 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar195 = ( irradiance * nodeVar194 );
	nodeVar196 = ( nodeVar174 + nodeVar175 );
	nodeVar197 = ( vec3<f32>( 1.0 ) - nodeVar196 );
	nodeVar198 = nodeVar197;
	nodeVar199 = ( nodeVar195 * nodeVar198 );
	nodeVar200 = nodeVar199;
	indirectDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar201 = ( indirectDiffuse + nodeVar200 );
	indirectDiffuse = nodeVar201;
	singleScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	singleScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar202 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar203 = ( SpecularF90 * dfg.y );
	nodeVar204 = ( nodeVar202 + vec3<f32>( nodeVar203 ) );
	nodeVar205 = ( singleScatteringDielectric + nodeVar204 );
	singleScatteringDielectric = nodeVar205;
	nodeVar206 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar207 = nodeVar206;
	nodeVar208 = ( nodeVar207 * vec3<f32>( 0.047619 ) );
	nodeVar209 = ( SpecularColor + nodeVar208 );
	nodeVar210 = ( nodeVar204 * nodeVar209 );
	nodeVar211 = ( dfg.x + dfg.y );
	nodeVar212 = ( 1.0 - nodeVar211 );
	nodeVar213 = nodeVar212;
	nodeVar214 = ( vec3<f32>( nodeVar213 ) * nodeVar209 );
	nodeVar215 = ( vec3<f32>( 1.0 ) - nodeVar214 );
	nodeVar216 = nodeVar215;
	nodeVar217 = ( nodeVar210 / nodeVar216 );
	nodeVar218 = ( nodeVar217 * vec3<f32>( nodeVar213 ) );
	nodeVar219 = ( multiScatteringDielectric + nodeVar218 );
	multiScatteringDielectric = nodeVar219;
	nodeVar220 = ( DiffuseColor.xyz * vec3<f32>( dfg.x ) );
	nodeVar221 = ( SpecularF90 * dfg.y );
	nodeVar222 = ( nodeVar220 + vec3<f32>( nodeVar221 ) );
	nodeVar223 = ( singleScatteringMetallic + nodeVar222 );
	singleScatteringMetallic = nodeVar223;
	nodeVar224 = ( vec3<f32>( 1.0 ) - DiffuseColor.xyz );
	nodeVar225 = nodeVar224;
	nodeVar226 = ( nodeVar225 * vec3<f32>( 0.047619 ) );
	nodeVar227 = ( DiffuseColor.xyz + nodeVar226 );
	nodeVar228 = ( nodeVar222 * nodeVar227 );
	nodeVar229 = ( dfg.x + dfg.y );
	nodeVar230 = ( 1.0 - nodeVar229 );
	nodeVar231 = nodeVar230;
	nodeVar232 = ( vec3<f32>( nodeVar231 ) * nodeVar227 );
	nodeVar233 = ( vec3<f32>( 1.0 ) - nodeVar232 );
	nodeVar234 = nodeVar233;
	nodeVar235 = ( nodeVar228 / nodeVar234 );
	nodeVar236 = ( nodeVar235 * vec3<f32>( nodeVar231 ) );
	nodeVar237 = ( multiScatteringMetallic + nodeVar236 );
	multiScatteringMetallic = nodeVar237;
	radiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar238 = mix( singleScatteringDielectric, singleScatteringMetallic, Metalness );
	nodeVar239 = ( radiance * nodeVar238 );
	nodeVar240 = mix( multiScatteringDielectric, multiScatteringMetallic, Metalness );
	iblIrradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar241 = ( iblIrradiance * vec3<f32>( 0.3183098861837907 ) );
	nodeVar242 = ( nodeVar240 * nodeVar241 );
	nodeVar243 = ( nodeVar239 + nodeVar242 );
	nodeVar244 = nodeVar243;
	nodeVar245 = ( singleScatteringDielectric + multiScatteringDielectric );
	nodeVar246 = ( vec3<f32>( 1.0 ) - nodeVar245 );
	nodeVar247 = nodeVar246;
	nodeVar248 = ( DiffuseContribution * nodeVar247 );
	nodeVar249 = ( nodeVar248 * nodeVar241 );
	nodeVar250 = nodeVar249;
	indirectSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar251 = ( indirectSpecular + nodeVar244 );
	indirectSpecular = nodeVar251;
	nodeVar252 = ( indirectDiffuse + nodeVar250 );
	indirectDiffuse = nodeVar252;
	ambientOcclusion = 1.0;
	nodeVar253 = ( indirectDiffuse * vec3<f32>( ambientOcclusion ) );
	indirectDiffuse = nodeVar253;
	nodeVar254 = dot( normalView, positionViewDirection );
	nodeVar255 = ( clamp( nodeVar254, 0.0, 1.0 ) + ambientOcclusion );
	nodeVar256 = ( Roughness * -16.0 );
	nodeVar257 = ( 1.0 - nodeVar256 );
	nodeVar258 = nodeVar257;
	nodeVar259 = ( - nodeVar258 );
	nodeVar260 = exp2( nodeVar259 );
	nodeVar261 = pow( nodeVar255, nodeVar260 );
	nodeVar262 = ( 1.0 - nodeVar261 );
	nodeVar263 = nodeVar262;
	nodeVar264 = ( ambientOcclusion - nodeVar263 );
	nodeVar265 = ( indirectSpecular * vec3<f32>( clamp( nodeVar264, 0.0, 1.0 ) ) );
	indirectSpecular = nodeVar265;
	nodeVar266 = ( directDiffuse + indirectDiffuse );
	totalDiffuse = nodeVar266;
	nodeVar267 = ( directSpecular + indirectSpecular );
	totalSpecular = nodeVar267;
	nodeVar268 = ( totalDiffuse + totalSpecular );
	outgoingLight = nodeVar268;
	Output = max( vec4<f32>( ( outgoingLight + EmissiveColor ), DiffuseColor.w ), vec4<f32>( 0.0 ) );
	nodeVar269 = ( - v_positionView.z );
	let nodeConst0 = max( ( 3.0 - v_positionWorld.y ), 0.0 );
	let nodeConst1 = ( nodeConst0 * ( - v_positionView.z ) );
	nodeVar270 = vec4<f32>( mix( Output.xyz, mix( object.nodeUniform30, object.nodeUniform31, pow( clamp( dot( normalize( ( v_positionWorld - render.cameraPosition ) ), object.nodeUniform33 ), 0.0, 1.0 ), 2.5 ) ), ( 1.0 - ( ( 1.0 - ( 1.0 - exp( ( - ( ( ( object.nodeUniform34 * object.nodeUniform34 ) * nodeVar269 ) * nodeVar269 ) ) ) ) ) * ( 1.0 - ( 1.0 - exp( ( - ( ( ( 0.0025 * 0.0025 ) * nodeConst1 ) * nodeConst1 ) ) ) ) ) ) ) ), Output.w );
	Output = nodeVar270;

	// result

	output.color = nodeVar270;

	return output;

}
