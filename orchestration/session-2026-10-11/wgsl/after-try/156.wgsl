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

struct NodeBuffer_9683Struct {
	value : array< vec4<f32>, 8 >
};
@binding( 3 ) @group( 1 )
var<uniform> NodeBuffer_9683 : NodeBuffer_9683Struct;

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
var<private> nodeVar58 : vec3<f32>;
var<private> nodeVar59 : f32;
var<private> Output : vec4<f32>;
var<private> positionViewDirection : vec3<f32>;
var<private> nodeVar60 : f32;
var<private> nodeVar61 : vec2<f32>;
var<private> nodeVar62 : f32;
var<private> nodeVar63 : f32;
var<private> nodeVar64 : f32;
var<private> nodeVar65 : f32;
var<private> nodeVar66 : vec3<f32>;
var<private> nodeVar67 : vec3<f32>;
var<private> irradiance : vec3<f32>;
var<private> nodeVar68 : f32;
var<private> nodeVar69 : f32;
var<private> nodeVar70 : f32;
var<private> nodeVar71 : vec3<f32>;
var<private> nodeVar72 : vec3<f32>;
var<private> nodeVar73 : vec3<f32>;
var<private> nodeVar74 : vec4<f32>;
var<private> nodeVar75 : vec4<f32>;
var<private> nodeVar76 : vec3<f32>;
var<private> nodeVar77 : vec3<f32>;
var<private> nodeVar78 : f32;
var<private> nodeVar79 : vec3<f32>;
var<private> nodeVar80 : vec3<f32>;
var<private> directDiffuse : vec3<f32>;
var<private> nodeVar81 : vec3<f32>;
var<private> nodeVar82 : vec3<f32>;
var<private> nodeVar83 : vec3<f32>;
var<private> nodeVar84 : vec3<f32>;
var<private> nodeVar85 : f32;
var<private> nodeVar86 : f32;
var<private> nodeVar87 : f32;
var<private> nodeVar88 : vec3<f32>;
var<private> nodeVar89 : vec3<f32>;
var<private> nodeVar90 : vec3<f32>;
var<private> nodeVar91 : vec3<f32>;
var<private> nodeVar92 : vec3<f32>;
var<private> directSpecular : vec3<f32>;
var<private> nodeVar93 : vec3<f32>;
var<private> nodeVar94 : f32;
var<private> nodeVar95 : f32;
var<private> nodeVar96 : f32;
var<private> nodeVar97 : vec3<f32>;
var<private> nodeVar98 : vec3<f32>;
var<private> nodeVar99 : vec3<f32>;
var<private> nodeVar100 : vec3<f32>;
var<private> nodeVar101 : vec3<f32>;
var<private> nodeVar102 : vec4<f32>;
var<private> nodeVar103 : vec4<f32>;
var<private> nodeVar104 : vec3<f32>;
var<private> nodeVar105 : vec3<f32>;
var<private> nodeVar106 : f32;
var<private> shadowPositionWorld : vec3<f32>;
var<private> nodeVar107 : f32;
var<private> nodeVar108 : vec4<f32>;
var<private> nodeVar109 : vec3<f32>;
var<private> nodeVar110 : vec3<f32>;
var<private> nodeVar111 : f32;
var<private> nodeVar112 : f32;
var<private> nodeVar113 : vec2<f32>;
var<private> nodeVar114 : f32;
var<private> nodeVar115 : vec2<f32>;
var<private> nodeVar116 : f32;
var<private> nodeVar117 : vec2<f32>;
var<private> nodeVar118 : f32;
var<private> nodeVar119 : vec2<f32>;
var<private> nodeVar120 : f32;
var<private> nodeVar121 : vec2<f32>;
var<private> nodeVar122 : f32;
var<private> nodeVar123 : f32;
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
var<private> nodeVar148 : f32;
var<private> nodeVar149 : f32;
var<private> nodeVar150 : f32;
var<private> nodeVar151 : f32;
var<private> nodeVar152 : f32;
var<private> nodeVar153 : vec3<f32>;
var<private> nodeVar154 : vec3<f32>;
var<private> nodeVar155 : vec3<f32>;
var<private> nodeVar156 : vec3<f32>;
var<private> nodeVar157 : vec3<f32>;
var<private> nodeVar158 : vec3<f32>;
var<private> nodeVar159 : vec3<f32>;
var<private> nodeVar160 : f32;
var<private> nodeVar161 : f32;
var<private> nodeVar162 : f32;
var<private> nodeVar163 : vec3<f32>;
var<private> nodeVar164 : vec3<f32>;
var<private> nodeVar165 : vec3<f32>;
var<private> nodeVar166 : vec3<f32>;
var<private> nodeVar167 : vec3<f32>;
var<private> nodeVar168 : vec3<f32>;
var<private> nodeVar169 : f32;
var<private> nodeVar170 : f32;
var<private> nodeVar171 : f32;
var<private> nodeVar172 : vec3<f32>;
var<private> nodeVar173 : vec3<f32>;
var<private> nodeVar174 : vec3<f32>;
var<private> nodeVar175 : vec3<f32>;
var<private> nodeVar176 : vec3<f32>;
var<private> nodeVar177 : vec3<f32>;
var<private> nodeVar178 : vec3<f32>;
var<private> nodeVar179 : f32;
var<private> nodeVar180 : vec3<f32>;
var<private> nodeVar181 : vec3<f32>;
var<private> nodeVar182 : vec3<f32>;
var<private> nodeVar183 : vec3<f32>;
var<private> nodeVar184 : vec3<f32>;
var<private> nodeVar185 : vec3<f32>;
var<private> nodeVar186 : vec3<f32>;
var<private> nodeVar187 : f32;
var<private> nodeVar188 : f32;
var<private> nodeVar189 : f32;
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
var<private> nodeVar201 : vec3<f32>;
var<private> nodeVar202 : vec3<f32>;
var<private> indirectDiffuse : vec3<f32>;
var<private> nodeVar203 : vec3<f32>;
var<private> singleScatteringDielectric : vec3<f32>;
var<private> multiScatteringDielectric : vec3<f32>;
var<private> singleScatteringMetallic : vec3<f32>;
var<private> multiScatteringMetallic : vec3<f32>;
var<private> nodeVar204 : vec3<f32>;
var<private> nodeVar205 : f32;
var<private> nodeVar206 : vec3<f32>;
var<private> nodeVar207 : vec3<f32>;
var<private> nodeVar208 : vec3<f32>;
var<private> nodeVar209 : vec3<f32>;
var<private> nodeVar210 : vec3<f32>;
var<private> nodeVar211 : vec3<f32>;
var<private> nodeVar212 : vec3<f32>;
var<private> nodeVar213 : f32;
var<private> nodeVar214 : f32;
var<private> nodeVar215 : f32;
var<private> nodeVar216 : vec3<f32>;
var<private> nodeVar217 : vec3<f32>;
var<private> nodeVar218 : vec3<f32>;
var<private> nodeVar219 : vec3<f32>;
var<private> nodeVar220 : vec3<f32>;
var<private> nodeVar221 : vec3<f32>;
var<private> nodeVar222 : vec3<f32>;
var<private> nodeVar223 : f32;
var<private> nodeVar224 : vec3<f32>;
var<private> nodeVar225 : vec3<f32>;
var<private> nodeVar226 : vec3<f32>;
var<private> nodeVar227 : vec3<f32>;
var<private> nodeVar228 : vec3<f32>;
var<private> nodeVar229 : vec3<f32>;
var<private> nodeVar230 : vec3<f32>;
var<private> nodeVar231 : f32;
var<private> nodeVar232 : f32;
var<private> nodeVar233 : f32;
var<private> nodeVar234 : vec3<f32>;
var<private> nodeVar235 : vec3<f32>;
var<private> nodeVar236 : vec3<f32>;
var<private> nodeVar237 : vec3<f32>;
var<private> nodeVar238 : vec3<f32>;
var<private> nodeVar239 : vec3<f32>;
var<private> radiance : vec3<f32>;
var<private> nodeVar240 : vec3<f32>;
var<private> nodeVar241 : vec3<f32>;
var<private> nodeVar242 : vec3<f32>;
var<private> iblIrradiance : vec3<f32>;
var<private> nodeVar243 : vec3<f32>;
var<private> nodeVar244 : vec3<f32>;
var<private> nodeVar245 : vec3<f32>;
var<private> nodeVar246 : vec3<f32>;
var<private> nodeVar247 : vec3<f32>;
var<private> nodeVar248 : vec3<f32>;
var<private> nodeVar249 : vec3<f32>;
var<private> nodeVar250 : vec3<f32>;
var<private> nodeVar251 : vec3<f32>;
var<private> nodeVar252 : vec3<f32>;
var<private> indirectSpecular : vec3<f32>;
var<private> nodeVar253 : vec3<f32>;
var<private> nodeVar254 : vec3<f32>;
var<private> ambientOcclusion : f32;
var<private> nodeVar255 : vec3<f32>;
var<private> nodeVar256 : f32;
var<private> nodeVar257 : f32;
var<private> nodeVar258 : f32;
var<private> nodeVar259 : f32;
var<private> nodeVar260 : f32;
var<private> nodeVar261 : f32;
var<private> nodeVar262 : f32;
var<private> nodeVar263 : f32;
var<private> nodeVar264 : f32;
var<private> nodeVar265 : f32;
var<private> nodeVar266 : f32;
var<private> nodeVar267 : vec3<f32>;
var<private> totalDiffuse : vec3<f32>;
var<private> nodeVar268 : vec3<f32>;
var<private> totalSpecular : vec3<f32>;
var<private> nodeVar269 : vec3<f32>;
var<private> outgoingLight : vec3<f32>;
var<private> nodeVar270 : vec3<f32>;
var<private> nodeVar271 : f32;
var<private> nodeVar272 : vec4<f32>;

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
	nodeVar38 = ( NodeBuffer_9683.value[ 0u ].xyz - v_positionWorld );
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
	nodeVar46 = ( NodeBuffer_9683.value[ 1u ].xyz - v_positionWorld );
	nodeVar47 = dot( nodeVar46, nodeVar46 );
	nodeVar48 = ( NodeBuffer_9683.value[ 2u ].xyz - v_positionWorld );
	nodeVar49 = dot( nodeVar48, nodeVar48 );
	nodeVar50 = ( NodeBuffer_9683.value[ 3u ].xyz - v_positionWorld );
	nodeVar51 = dot( nodeVar50, nodeVar50 );
	nodeVar52 = ( NodeBuffer_9683.value[ 4u ].xyz - v_positionWorld );
	nodeVar53 = dot( nodeVar52, nodeVar52 );
	nodeVar54 = ( NodeBuffer_9683.value[ 5u ].xyz - v_positionWorld );
	nodeVar55 = dot( nodeVar54, nodeVar54 );
	nodeVar56 = ( NodeBuffer_9683.value[ 6u ].xyz - v_positionWorld );
	nodeVar57 = dot( nodeVar56, nodeVar56 );
	nodeVar58 = ( NodeBuffer_9683.value[ 7u ].xyz - v_positionWorld );
	nodeVar59 = dot( nodeVar58, nodeVar58 );
	EmissiveColor = ( nodeVar36 * ( ( ( ( ( ( ( ( vec3<f32>( 0.0, 0.0, 0.0 ) + ( vec3<f32>( 1.0, 0.5, 0.17 ) * vec3<f32>( ( ( ( ( NodeBuffer_9683.value[ 0u ].w * ( 1.0 / ( 1.0 + ( nodeVar39 * 0.55 ) ) ) ) * ( ( clamp( dot( normalWorld, normalize( nodeVar38 ) ), 0.0, 1.0 ) * 0.8 ) + 0.2 ) ) * smoothstep( 1.0, 0.12, ( nodeVar39 / 64.0 ) ) ) * ( ( 0.88 + ( sin( ( ( render.nodeUniform8 * 11.0 ) + 0.0 ) ) * 0.07 ) ) + ( sin( ( ( render.nodeUniform8 * 5.3 ) + ( 0.0 * 1.9 ) ) ) * 0.05 ) ) ) ) ) ) + ( vec3<f32>( 1.0, 0.5, 0.17 ) * vec3<f32>( ( ( ( ( NodeBuffer_9683.value[ 1u ].w * ( 1.0 / ( 1.0 + ( nodeVar47 * 0.55 ) ) ) ) * ( ( clamp( dot( normalWorld, normalize( nodeVar46 ) ), 0.0, 1.0 ) * 0.8 ) + 0.2 ) ) * smoothstep( 1.0, 0.12, ( nodeVar47 / 64.0 ) ) ) * ( ( 0.88 + ( sin( ( ( render.nodeUniform8 * 11.0 ) + 2.13 ) ) * 0.07 ) ) + ( sin( ( ( render.nodeUniform8 * 5.3 ) + ( 2.13 * 1.9 ) ) ) * 0.05 ) ) ) ) ) ) + ( vec3<f32>( 1.0, 0.5, 0.17 ) * vec3<f32>( ( ( ( ( NodeBuffer_9683.value[ 2u ].w * ( 1.0 / ( 1.0 + ( nodeVar49 * 0.55 ) ) ) ) * ( ( clamp( dot( normalWorld, normalize( nodeVar48 ) ), 0.0, 1.0 ) * 0.8 ) + 0.2 ) ) * smoothstep( 1.0, 0.12, ( nodeVar49 / 64.0 ) ) ) * ( ( 0.88 + ( sin( ( ( render.nodeUniform8 * 11.0 ) + 4.26 ) ) * 0.07 ) ) + ( sin( ( ( render.nodeUniform8 * 5.3 ) + ( 4.26 * 1.9 ) ) ) * 0.05 ) ) ) ) ) ) + ( vec3<f32>( 1.0, 0.5, 0.17 ) * vec3<f32>( ( ( ( ( NodeBuffer_9683.value[ 3u ].w * ( 1.0 / ( 1.0 + ( nodeVar51 * 0.55 ) ) ) ) * ( ( clamp( dot( normalWorld, normalize( nodeVar50 ) ), 0.0, 1.0 ) * 0.8 ) + 0.2 ) ) * smoothstep( 1.0, 0.12, ( nodeVar51 / 64.0 ) ) ) * ( ( 0.88 + ( sin( ( ( render.nodeUniform8 * 11.0 ) + 6.39 ) ) * 0.07 ) ) + ( sin( ( ( render.nodeUniform8 * 5.3 ) + ( 6.39 * 1.9 ) ) ) * 0.05 ) ) ) ) ) ) + ( vec3<f32>( 1.0, 0.5, 0.17 ) * vec3<f32>( ( ( ( ( NodeBuffer_9683.value[ 4u ].w * ( 1.0 / ( 1.0 + ( nodeVar53 * 0.55 ) ) ) ) * ( ( clamp( dot( normalWorld, normalize( nodeVar52 ) ), 0.0, 1.0 ) * 0.8 ) + 0.2 ) ) * smoothstep( 1.0, 0.12, ( nodeVar53 / 64.0 ) ) ) * ( ( 0.88 + ( sin( ( ( render.nodeUniform8 * 11.0 ) + 8.52 ) ) * 0.07 ) ) + ( sin( ( ( render.nodeUniform8 * 5.3 ) + ( 8.52 * 1.9 ) ) ) * 0.05 ) ) ) ) ) ) + ( vec3<f32>( 1.0, 0.5, 0.17 ) * vec3<f32>( ( ( ( ( NodeBuffer_9683.value[ 5u ].w * ( 1.0 / ( 1.0 + ( nodeVar55 * 0.55 ) ) ) ) * ( ( clamp( dot( normalWorld, normalize( nodeVar54 ) ), 0.0, 1.0 ) * 0.8 ) + 0.2 ) ) * smoothstep( 1.0, 0.12, ( nodeVar55 / 64.0 ) ) ) * ( ( 0.88 + ( sin( ( ( render.nodeUniform8 * 11.0 ) + 10.649999999999999 ) ) * 0.07 ) ) + ( sin( ( ( render.nodeUniform8 * 5.3 ) + ( 10.649999999999999 * 1.9 ) ) ) * 0.05 ) ) ) ) ) ) + ( vec3<f32>( 1.0, 0.5, 0.17 ) * vec3<f32>( ( ( ( ( NodeBuffer_9683.value[ 6u ].w * ( 1.0 / ( 1.0 + ( nodeVar57 * 0.55 ) ) ) ) * ( ( clamp( dot( normalWorld, normalize( nodeVar56 ) ), 0.0, 1.0 ) * 0.8 ) + 0.2 ) ) * smoothstep( 1.0, 0.12, ( nodeVar57 / 64.0 ) ) ) * ( ( 0.88 + ( sin( ( ( render.nodeUniform8 * 11.0 ) + 12.78 ) ) * 0.07 ) ) + ( sin( ( ( render.nodeUniform8 * 5.3 ) + ( 12.78 * 1.9 ) ) ) * 0.05 ) ) ) ) ) ) + ( vec3<f32>( 1.0, 0.5, 0.17 ) * vec3<f32>( ( ( ( ( NodeBuffer_9683.value[ 7u ].w * ( 1.0 / ( 1.0 + ( nodeVar59 * 0.55 ) ) ) ) * ( ( clamp( dot( normalWorld, normalize( nodeVar58 ) ), 0.0, 1.0 ) * 0.8 ) + 0.2 ) ) * smoothstep( 1.0, 0.12, ( nodeVar59 / 64.0 ) ) ) * ( ( 0.88 + ( sin( ( ( render.nodeUniform8 * 11.0 ) + 14.91 ) ) * 0.07 ) ) + ( sin( ( ( render.nodeUniform8 * 5.3 ) + ( 14.91 * 1.9 ) ) ) * 0.05 ) ) ) ) ) ) );
	positionViewDirection = normalize( v_positionViewDirection );
	nodeVar60 = dot( normalView, positionViewDirection );
	nodeVar61 = textureSample( nodeUniform9, nodeUniform9_sampler, vec2<f32>( Roughness, clamp( nodeVar60, 0.0, 1.0 ) ) ).xy;
	let dfg = nodeVar61;
	nodeVar62 = ( dfg.x + dfg.y );
	nodeVar63 = ( 1.0 / nodeVar62 );
	nodeVar64 = nodeVar63;
	nodeVar65 = ( nodeVar64 - 1.0 );
	nodeVar66 = ( SpecularColorBlended * vec3<f32>( nodeVar65 ) );
	nodeVar67 = ( nodeVar66 + vec3<f32>( 1.0 ) );
	let multiScatteringCompensation = nodeVar67;
	irradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar68 = dot( normalWorld, normalize( render.nodeUniform12 ) );
	nodeVar69 = ( nodeVar68 * 0.5 );
	nodeVar70 = ( nodeVar69 + 0.5 );
	nodeVar71 = mix( render.nodeUniform10, render.nodeUniform11, nodeVar70 );
	nodeVar72 = ( irradiance + nodeVar71 );
	irradiance = nodeVar72;
	nodeVar73 = ( render.nodeUniform13 - render.nodeUniform14 );
	nodeVar74 = vec4<f32>( nodeVar73, 0.0 );
	nodeVar75 = ( render.cameraViewMatrix * nodeVar74 );
	nodeVar76 = normalize( nodeVar75.xyz );
	nodeVar77 = nodeVar76;
	nodeVar78 = dot( normalView, nodeVar77 );
	nodeVar79 = ( vec3<f32>( clamp( nodeVar78, 0.0, 1.0 ) ) * render.nodeUniform15 );
	nodeVar80 = nodeVar79;
	directDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar81 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar82 = ( nodeVar80 * nodeVar81 );
	nodeVar83 = ( nodeVar77 + positionViewDirection );
	nodeVar84 = normalize( nodeVar83 );
	nodeVar85 = dot( positionViewDirection, nodeVar84 );
	nodeVar86 = clamp( nodeVar85, 0.0, 1.0 );
	nodeVar87 = exp2( ( ( ( nodeVar86 * -5.55473 ) - 6.98316 ) * nodeVar86 ) );
	nodeVar88 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar87 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar87 ) ) );
	nodeVar89 = ( vec3<f32>( 1.0 ) - nodeVar88 );
	nodeVar90 = nodeVar89;
	nodeVar91 = ( nodeVar82 * nodeVar90 );
	nodeVar92 = ( directDiffuse + nodeVar91 );
	directDiffuse = nodeVar92;
	directSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar93 = normalize( ( nodeVar77 + positionViewDirection ) );
	nodeVar94 = clamp( dot( positionViewDirection, nodeVar93 ), 0.0, 1.0 );
	nodeVar95 = exp2( ( ( ( nodeVar94 * -5.55473 ) - 6.98316 ) * nodeVar94 ) );
	nodeVar96 = ( Roughness * Roughness );
	nodeVar97 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar95 ) ) ) + vec3<f32>( ( 1.0 * nodeVar95 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar96, clamp( dot( normalView, nodeVar77 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar96, clamp( dot( normalView, nodeVar93 ), 0.0, 1.0 ) ) ) );
	nodeVar98 = ( nodeVar80 * nodeVar97 );
	nodeVar99 = ( nodeVar98 * multiScatteringCompensation );
	nodeVar100 = ( directSpecular + nodeVar99 );
	directSpecular = nodeVar100;
	nodeVar101 = ( render.nodeUniform16 - render.nodeUniform17 );
	nodeVar102 = vec4<f32>( nodeVar101, 0.0 );
	nodeVar103 = ( render.cameraViewMatrix * nodeVar102 );
	nodeVar104 = normalize( nodeVar103.xyz );
	nodeVar105 = nodeVar104;
	nodeVar106 = dot( normalView, nodeVar105 );
	shadowPositionWorld = v_positionWorld;
	nodeVar108 = ( render.nodeUniform19 * vec4<f32>( ( shadowPositionWorld + ( normalWorld * vec3<f32>( render.nodeUniform20 ) ) ), 1.0 ) );
	nodeVar109 = ( nodeVar108.xyz / vec3<f32>( nodeVar108.w ) );
	nodeVar110 = vec3<f32>( nodeVar109.x, ( 1.0 - nodeVar109.y ), ( nodeVar109.z + render.nodeUniform21 ) );

	if ( ( ( ( ( ( nodeVar110.x >= 0.0 ) && ( nodeVar110.x <= 1.0 ) ) && ( nodeVar110.y >= 0.0 ) ) && ( nodeVar110.y <= 1.0 ) ) && ( nodeVar110.z <= 1.0 ) ) ) {

		nodeVar111 = ( interleavedGradientNoise( fragCoord.xy ) * 6.28318530718 );
		nodeVar112 = ( render.nodeUniform23 * ( vec2<f32>( 1.0, 1.0 ) / render.nodeUniform24 ).x );
		nodeVar113 = ( nodeVar110.xy + ( vogelDiskSample( 0, 5, nodeVar111 ) * vec2<f32>( nodeVar112 ) ) );
		nodeVar114 = textureSampleCompare( nodeUniform22, nodeUniform22_sampler, nodeVar113, nodeVar110.z );
		nodeVar115 = ( nodeVar110.xy + ( vogelDiskSample( 1, 5, nodeVar111 ) * vec2<f32>( nodeVar112 ) ) );
		nodeVar116 = textureSampleCompare( nodeUniform22, nodeUniform22_sampler, nodeVar115, nodeVar110.z );
		nodeVar117 = ( nodeVar110.xy + ( vogelDiskSample( 2, 5, nodeVar111 ) * vec2<f32>( nodeVar112 ) ) );
		nodeVar118 = textureSampleCompare( nodeUniform22, nodeUniform22_sampler, nodeVar117, nodeVar110.z );
		nodeVar119 = ( nodeVar110.xy + ( vogelDiskSample( 3, 5, nodeVar111 ) * vec2<f32>( nodeVar112 ) ) );
		nodeVar120 = textureSampleCompare( nodeUniform22, nodeUniform22_sampler, nodeVar119, nodeVar110.z );
		nodeVar121 = ( nodeVar110.xy + ( vogelDiskSample( 4, 5, nodeVar111 ) * vec2<f32>( nodeVar112 ) ) );
		nodeVar122 = textureSampleCompare( nodeUniform22, nodeUniform22_sampler, nodeVar121, nodeVar110.z );
		nodeVar107 = ( ( ( ( ( nodeVar114 + nodeVar116 ) + nodeVar118 ) + nodeVar120 ) + nodeVar122 ) * 0.2 );

	} else {

		nodeVar107 = 1.0;

	}

	nodeVar123 = mix( 1.0, nodeVar107, render.nodeUniform25 );
	nodeVar124 = ( vec3<f32>( clamp( nodeVar106, 0.0, 1.0 ) ) * ( render.nodeUniform18 * vec3<f32>( nodeVar123 ) ) );
	nodeVar125 = nodeVar124;
	nodeVar126 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar127 = ( nodeVar125 * nodeVar126 );
	nodeVar128 = ( nodeVar105 + positionViewDirection );
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
	nodeVar138 = normalize( ( nodeVar105 + positionViewDirection ) );
	nodeVar139 = clamp( dot( positionViewDirection, nodeVar138 ), 0.0, 1.0 );
	nodeVar140 = exp2( ( ( ( nodeVar139 * -5.55473 ) - 6.98316 ) * nodeVar139 ) );
	nodeVar141 = ( Roughness * Roughness );
	nodeVar142 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar140 ) ) ) + vec3<f32>( ( 1.0 * nodeVar140 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar141, clamp( dot( normalView, nodeVar105 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar141, clamp( dot( normalView, nodeVar138 ), 0.0, 1.0 ) ) ) );
	nodeVar143 = ( nodeVar125 * nodeVar142 );
	nodeVar144 = ( nodeVar143 * multiScatteringCompensation );
	nodeVar145 = ( directSpecular + nodeVar144 );
	directSpecular = nodeVar145;
	nodeVar146 = ( render.nodeUniform26 - v_positionView );
	nodeVar147 = normalize( nodeVar146 );
	nodeVar148 = dot( normalView, nodeVar147 );

	if ( ( render.nodeUniform28 > 0.0 ) ) {

		nodeVar150 = length( nodeVar146 );
		nodeVar151 = ( nodeVar150 / render.nodeUniform28 );
		nodeVar152 = clamp( ( 1.0 - ( ( ( nodeVar151 * nodeVar151 ) * nodeVar151 ) * nodeVar151 ) ), 0.0, 1.0 );
		nodeVar149 = ( ( 1.0 / max( pow( nodeVar150, render.nodeUniform29 ), 0.01 ) ) * ( nodeVar152 * nodeVar152 ) );

	} else {

		nodeVar149 = ( 1.0 / max( pow( length( nodeVar146 ), render.nodeUniform29 ), 0.01 ) );

	}

	nodeVar153 = ( render.nodeUniform27 * vec3<f32>( nodeVar149 ) );
	nodeVar154 = ( vec3<f32>( clamp( nodeVar148, 0.0, 1.0 ) ) * nodeVar153 );
	nodeVar155 = nodeVar154;
	nodeVar156 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar157 = ( nodeVar155 * nodeVar156 );
	nodeVar158 = ( nodeVar147 + positionViewDirection );
	nodeVar159 = normalize( nodeVar158 );
	nodeVar160 = dot( positionViewDirection, nodeVar159 );
	nodeVar161 = clamp( nodeVar160, 0.0, 1.0 );
	nodeVar162 = exp2( ( ( ( nodeVar161 * -5.55473 ) - 6.98316 ) * nodeVar161 ) );
	nodeVar163 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar162 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar162 ) ) );
	nodeVar164 = ( vec3<f32>( 1.0 ) - nodeVar163 );
	nodeVar165 = nodeVar164;
	nodeVar166 = ( nodeVar157 * nodeVar165 );
	nodeVar167 = ( directDiffuse + nodeVar166 );
	directDiffuse = nodeVar167;
	nodeVar168 = normalize( ( nodeVar147 + positionViewDirection ) );
	nodeVar169 = clamp( dot( positionViewDirection, nodeVar168 ), 0.0, 1.0 );
	nodeVar170 = exp2( ( ( ( nodeVar169 * -5.55473 ) - 6.98316 ) * nodeVar169 ) );
	nodeVar171 = ( Roughness * Roughness );
	nodeVar172 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar170 ) ) ) + vec3<f32>( ( 1.0 * nodeVar170 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar171, clamp( dot( normalView, nodeVar147 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar171, clamp( dot( normalView, nodeVar168 ), 0.0, 1.0 ) ) ) );
	nodeVar173 = ( nodeVar155 * nodeVar172 );
	nodeVar174 = ( nodeVar173 * multiScatteringCompensation );
	nodeVar175 = ( directSpecular + nodeVar174 );
	directSpecular = nodeVar175;
	nodeVar176 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar177 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar178 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar179 = ( SpecularF90 * dfg.y );
	nodeVar180 = ( nodeVar178 + vec3<f32>( nodeVar179 ) );
	nodeVar181 = ( nodeVar176 + nodeVar180 );
	nodeVar176 = nodeVar181;
	nodeVar182 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar183 = nodeVar182;
	nodeVar184 = ( nodeVar183 * vec3<f32>( 0.047619 ) );
	nodeVar185 = ( SpecularColor + nodeVar184 );
	nodeVar186 = ( nodeVar180 * nodeVar185 );
	nodeVar187 = ( dfg.x + dfg.y );
	nodeVar188 = ( 1.0 - nodeVar187 );
	nodeVar189 = nodeVar188;
	nodeVar190 = ( vec3<f32>( nodeVar189 ) * nodeVar185 );
	nodeVar191 = ( vec3<f32>( 1.0 ) - nodeVar190 );
	nodeVar192 = nodeVar191;
	nodeVar193 = ( nodeVar186 / nodeVar192 );
	nodeVar194 = ( nodeVar193 * vec3<f32>( nodeVar189 ) );
	nodeVar195 = ( nodeVar177 + nodeVar194 );
	nodeVar177 = nodeVar195;
	nodeVar196 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar197 = ( irradiance * nodeVar196 );
	nodeVar198 = ( nodeVar176 + nodeVar177 );
	nodeVar199 = ( vec3<f32>( 1.0 ) - nodeVar198 );
	nodeVar200 = nodeVar199;
	nodeVar201 = ( nodeVar197 * nodeVar200 );
	nodeVar202 = nodeVar201;
	indirectDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar203 = ( indirectDiffuse + nodeVar202 );
	indirectDiffuse = nodeVar203;
	singleScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	singleScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar204 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar205 = ( SpecularF90 * dfg.y );
	nodeVar206 = ( nodeVar204 + vec3<f32>( nodeVar205 ) );
	nodeVar207 = ( singleScatteringDielectric + nodeVar206 );
	singleScatteringDielectric = nodeVar207;
	nodeVar208 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar209 = nodeVar208;
	nodeVar210 = ( nodeVar209 * vec3<f32>( 0.047619 ) );
	nodeVar211 = ( SpecularColor + nodeVar210 );
	nodeVar212 = ( nodeVar206 * nodeVar211 );
	nodeVar213 = ( dfg.x + dfg.y );
	nodeVar214 = ( 1.0 - nodeVar213 );
	nodeVar215 = nodeVar214;
	nodeVar216 = ( vec3<f32>( nodeVar215 ) * nodeVar211 );
	nodeVar217 = ( vec3<f32>( 1.0 ) - nodeVar216 );
	nodeVar218 = nodeVar217;
	nodeVar219 = ( nodeVar212 / nodeVar218 );
	nodeVar220 = ( nodeVar219 * vec3<f32>( nodeVar215 ) );
	nodeVar221 = ( multiScatteringDielectric + nodeVar220 );
	multiScatteringDielectric = nodeVar221;
	nodeVar222 = ( DiffuseColor.xyz * vec3<f32>( dfg.x ) );
	nodeVar223 = ( SpecularF90 * dfg.y );
	nodeVar224 = ( nodeVar222 + vec3<f32>( nodeVar223 ) );
	nodeVar225 = ( singleScatteringMetallic + nodeVar224 );
	singleScatteringMetallic = nodeVar225;
	nodeVar226 = ( vec3<f32>( 1.0 ) - DiffuseColor.xyz );
	nodeVar227 = nodeVar226;
	nodeVar228 = ( nodeVar227 * vec3<f32>( 0.047619 ) );
	nodeVar229 = ( DiffuseColor.xyz + nodeVar228 );
	nodeVar230 = ( nodeVar224 * nodeVar229 );
	nodeVar231 = ( dfg.x + dfg.y );
	nodeVar232 = ( 1.0 - nodeVar231 );
	nodeVar233 = nodeVar232;
	nodeVar234 = ( vec3<f32>( nodeVar233 ) * nodeVar229 );
	nodeVar235 = ( vec3<f32>( 1.0 ) - nodeVar234 );
	nodeVar236 = nodeVar235;
	nodeVar237 = ( nodeVar230 / nodeVar236 );
	nodeVar238 = ( nodeVar237 * vec3<f32>( nodeVar233 ) );
	nodeVar239 = ( multiScatteringMetallic + nodeVar238 );
	multiScatteringMetallic = nodeVar239;
	radiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar240 = mix( singleScatteringDielectric, singleScatteringMetallic, Metalness );
	nodeVar241 = ( radiance * nodeVar240 );
	nodeVar242 = mix( multiScatteringDielectric, multiScatteringMetallic, Metalness );
	iblIrradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar243 = ( iblIrradiance * vec3<f32>( 0.3183098861837907 ) );
	nodeVar244 = ( nodeVar242 * nodeVar243 );
	nodeVar245 = ( nodeVar241 + nodeVar244 );
	nodeVar246 = nodeVar245;
	nodeVar247 = ( singleScatteringDielectric + multiScatteringDielectric );
	nodeVar248 = ( vec3<f32>( 1.0 ) - nodeVar247 );
	nodeVar249 = nodeVar248;
	nodeVar250 = ( DiffuseContribution * nodeVar249 );
	nodeVar251 = ( nodeVar250 * nodeVar243 );
	nodeVar252 = nodeVar251;
	indirectSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar253 = ( indirectSpecular + nodeVar246 );
	indirectSpecular = nodeVar253;
	nodeVar254 = ( indirectDiffuse + nodeVar252 );
	indirectDiffuse = nodeVar254;
	ambientOcclusion = 1.0;
	nodeVar255 = ( indirectDiffuse * vec3<f32>( ambientOcclusion ) );
	indirectDiffuse = nodeVar255;
	nodeVar256 = dot( normalView, positionViewDirection );
	nodeVar257 = ( clamp( nodeVar256, 0.0, 1.0 ) + ambientOcclusion );
	nodeVar258 = ( Roughness * -16.0 );
	nodeVar259 = ( 1.0 - nodeVar258 );
	nodeVar260 = nodeVar259;
	nodeVar261 = ( - nodeVar260 );
	nodeVar262 = exp2( nodeVar261 );
	nodeVar263 = pow( nodeVar257, nodeVar262 );
	nodeVar264 = ( 1.0 - nodeVar263 );
	nodeVar265 = nodeVar264;
	nodeVar266 = ( ambientOcclusion - nodeVar265 );
	nodeVar267 = ( indirectSpecular * vec3<f32>( clamp( nodeVar266, 0.0, 1.0 ) ) );
	indirectSpecular = nodeVar267;
	nodeVar268 = ( directDiffuse + indirectDiffuse );
	totalDiffuse = nodeVar268;
	nodeVar269 = ( directSpecular + indirectSpecular );
	totalSpecular = nodeVar269;
	nodeVar270 = ( totalDiffuse + totalSpecular );
	outgoingLight = nodeVar270;
	Output = max( vec4<f32>( ( outgoingLight + EmissiveColor ), DiffuseColor.w ), vec4<f32>( 0.0 ) );
	nodeVar271 = ( - v_positionView.z );
	let nodeConst0 = max( ( 3.0 - v_positionWorld.y ), 0.0 );
	let nodeConst1 = ( nodeConst0 * ( - v_positionView.z ) );
	nodeVar272 = vec4<f32>( mix( Output.xyz, mix( object.nodeUniform30, object.nodeUniform31, pow( clamp( dot( normalize( ( v_positionWorld - render.cameraPosition ) ), object.nodeUniform33 ), 0.0, 1.0 ), 2.5 ) ), ( 1.0 - ( ( 1.0 - ( 1.0 - exp( ( - ( ( ( object.nodeUniform34 * object.nodeUniform34 ) * nodeVar271 ) * nodeVar271 ) ) ) ) ) * ( 1.0 - ( 1.0 - exp( ( - ( ( ( 0.0025 * 0.0025 ) * nodeConst1 ) * nodeConst1 ) ) ) ) ) ) ) ), Output.w );
	Output = nodeVar272;

	// result

	output.color = nodeVar272;

	return output;

}
